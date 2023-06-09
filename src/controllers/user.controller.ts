import { NextFunction, Request, Response } from "express";
import User from "./../models/user.model";
import SendEmail from "../shared/utils/sendEmail.utils";
import catchAsync from "../shared/utils/catchAsync.utils";
import {
  emailSubject,
  emailMessage,
  EMAIL_ACTIVATION_ERROR,
  EMAIL_SEND_ERROR,
  EMPTY_LOGIN,
  WRONG_LOGIN,
  EMPTY_EMAIL,
  WRONG_EMAIL,
  EMAIL_FORGOTPASSWORD_ERROR,
  ERROR_RESET_TOKEN,
  USER_PROTECT,
  EMPTY_PASSWORD,
  WRONG_PASSWORD_ROUTE,
  EMAIL_RESET_EMAIL_ERROR,
  EMAIL_NEW_EMPTY,
  EMAIL_DISABLE_ACCOUNT,
  EMAIL_DISABLE_ACCOUNT_ERROR,
} from "../shared/messages";
import crypto from "crypto";
import AppError from "../shared/utils/AppError.utils";
import { UserInterface, userRequestInterface } from "../shared/interfaces";
import bodyFilter from "../shared/utils/filterBodyRequest.utils";

export const signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.create({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      role: req.body.role,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    const resetToken = user.createResetRandomToken("activation");
    await user.save({ validateBeforeSave: false });

    const resetUrl = user.createResetUrl(req, resetToken, "activation");

    try {
      await SendEmail({
        to: user.email,
        subject: emailSubject("signup"),
        text: emailMessage("signup", resetUrl, 10),
      });
    } catch (error) {
      user.activationAccountToken = undefined;
      user.activationAccountTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError(EMAIL_SEND_ERROR, 500));
    }

    res.status(200).json({
      status: "success",
      message: `Un email de confirmation a été envoyé à ${user.email}. Veuillez vérifier votre boîte de réception pour activer votre compte.`,
    });
  }
);

export const activationAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { password } = req.body;
    const resetToken = req.params.token;

    const hashToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      activationAccountToken: hashToken,
      activationAccountTokenExpire: { $gte: Date.now() },
    }).select("+password");

    if (!user || !(await user.checkUserPassword(password, user.password))) {
      return next(new AppError(EMAIL_ACTIVATION_ERROR, 404));
    }

    user.activeUserAccount();
    await user.save({ validateBeforeSave: false });

    const token = user.createAndSendToken(res, user.id, user.role);

    res.status(200).json({
      status: "success",
      message: "Votre compte a été activé avec succès.",
      token,
    });
  }
);

// TODO:
// Voir si il est possible d'effectuer moins de sauvegarder dans la phase login pour améliorer les performances
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError(EMPTY_LOGIN, 401));
    }

    const user = await User.findOne<UserInterface>({ email }).select(
      "+password"
    );

    if (!user) {
      return next(new AppError(WRONG_LOGIN, 401));
    }

    if (!(await user.checkUserPassword(password, user.password))) {
      user.enterWrongPassword();
      await user.save({ validateBeforeSave: false });
      return next(new AppError(WRONG_LOGIN, 404));
    }

    if (user.loginFailures) {
      user.loginFailures = undefined;
      await user.save({ validateBeforeSave: false });
    }

    const token = user.createAndSendToken(res, user.id, user.role);

    res.status(200).json({
      status: "success",
      token,
    });
  }
);

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return next(new AppError(EMPTY_EMAIL, 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError(WRONG_EMAIL, 400));
    }

    const resetToken = user.createResetRandomToken("password");

    try {
      const subject = emailSubject("password");
      const resetUrl = user.createResetUrl(req, resetToken, "password");
      const text = emailMessage("password", resetUrl, 10);

      await SendEmail({
        to: user.email,
        subject,
        text,
      });
      await user.save({ validateBeforeSave: false });

      res.status(200).json({
        status: "success",
        message: `Un email de confirmation a été envoyé à ${user.email}. Veuillez vérifier votre boîte de réception pour réinitialiser votre mot de passe.`,
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError(EMAIL_FORGOTPASSWORD_ERROR, 500));
    }
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken,
      passwordResetTokenExpire: { $gte: new Date(Date.now()) },
    });

    if (!user) {
      return next(new AppError(ERROR_RESET_TOKEN, 401));
    }
    const { password, passwordConfirm } = req.body;

    user.changeUserPassword(password, passwordConfirm);
    await user.save();

    const token = user.createAndSendToken(res, user.id, user.role);

    res.status(200).json({
      status: "success",
      message: "Votre mot de passe a été modifié",
      token,
    });
  }
);

export const updatePassword = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return next(new AppError(USER_PROTECT, 401));
    }

    const { password, newPassword, newPasswordConfirm } = req.body;

    if (!password || !(await user.checkUserPassword(password, user.password))) {
      return next(new AppError(EMPTY_PASSWORD, 400));
    }

    user.changeUserPassword(newPassword, newPasswordConfirm);
    await user.save();

    const token = user.createAndSendToken(res, user.id, user.role);

    res.status(200).json({
      status: "success",
      message: "Votre mot de passe a été modifié.",
      token,
    });
  }
);

export const getMe = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.id).select(
      "firstname lastname email role"
    );

    if (!user) {
      return next(new AppError(USER_PROTECT, 401));
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  }
);

export const updateUserProfile = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const { password } = req.body;

    if (password) {
      return next(new AppError(WRONG_PASSWORD_ROUTE, 400));
    }

    const filteredBody = bodyFilter(req.body, "firstname", "lastname");

    const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      runValidators: true,
    });

    if (!user) {
      return next(new AppError(USER_PROTECT, 401));
    }

    res.status(200).json({
      status: "success",
      message: `Vous avez effectué des modifications sur les champs ${Object.keys(
        filteredBody
      )}`,
    });
  }
);

export const resetEmail = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError(USER_PROTECT, 401));
    }

    const resetToken = user.createResetRandomToken("email");
    const resetUrl = user.createResetUrl(req, resetToken, "email");
    const subject = emailSubject("email");
    const text = emailMessage("email", resetUrl, 10);
    try {
      await SendEmail({
        to: user.email,
        subject,
        text,
      });

      await user.save({ validateBeforeSave: false });

      res.status(200).json({
        status: "success",
        message: `Un email a été envoyé à ${user.email} pour confirmer votre demande de changement d'adresse email. Veuillez vérifier votre boîte de réception afin d'entrer la nouvelle adresse email.`,
      });
    } catch (error) {
      user.emailResetToken = undefined;
      user.emailResetTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError(EMAIL_RESET_EMAIL_ERROR, 500));
    }
  }
);

export const changeEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tokenHash = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailResetToken: tokenHash,
      emailResetTokenExpire: { $gte: new Date(Date.now()) },
    });

    if (!user) {
      return next(new AppError(ERROR_RESET_TOKEN, 401));
    }

    const { newEmail } = req.body;

    if (!newEmail) {
      return next(new AppError(EMAIL_NEW_EMPTY, 400));
    }

    user.changeUserEmail(newEmail);
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
      status: "success",
      message: "Votre adresse email a été modifiée.",
    });
  }
);

export const disableUserAccount = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError(USER_PROTECT, 401));
    }

    user.disableAccount();
    await user.save({ validateBeforeSave: false });

    try {
      const subject = emailSubject("disable");
      const text = EMAIL_DISABLE_ACCOUNT;
      await SendEmail({
        to: user.email,
        subject,
        text,
      });
      res.status(200).json({
        status: "success",
        message: `Un email de notification concernant la désactivation de votre compte a été envoyé à ${user.email}.`,
      });
    } catch (error) {
      return next(new AppError(EMAIL_DISABLE_ACCOUNT_ERROR, 500));
    }
  }
);
