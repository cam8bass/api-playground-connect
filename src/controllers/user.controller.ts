import { NextFunction, Request, Response } from "express";
import User from "./../models/user.model";
import catchAsync from "../shared/utils/catchAsync.utils";
import crypto from "crypto";
import AppError from "../shared/utils/AppError.utils";
import { UserInterface, userRequestInterface } from "../shared/interfaces";
import bodyFilter from "../shared/utils/filterBodyRequest.utils";
import { AppMessage } from "../shared/messages";
import EmailManager from "../shared/utils/EmailManager.utils";
import { emailMessages } from "../shared/messages";

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

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: emailMessages.subjectEmail.SUBJECT_MODIFIED_STATUS("Activation"),
      text: emailMessages.bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    if (!sendEmail) {
      user.activationAccountToken = undefined;
      user.activationAccountTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(AppMessage.errorMessage.ERROR_SENT_EMAIL_ACTIVATION, 500)
      );
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_SENT_EMAIL_ACTIVATION(
        user.email
      ),
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

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LINK_ACTIVATION_EXPIRED, 404)
      );
    }

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_WRONG_PASSWORD, 401)
      );
    }

    user.activeUserAccount();
    await user.save({ validateBeforeSave: false });

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: emailMessages.subjectEmail.SUBJECT_MODIFIED_STATUS("Activation"),
      text: emailMessages.bodyEmail.ACCOUNT_ACTIVATED,
    });

    if (!sendEmail) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_NOTIFICATION_ACTIVATION_ACCOUNT,
          500
        )
      );
    }
    const token = await user.createAndSendToken(res, user.id, user.role);

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_ACTIVATION_ACCOUNT,
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
      return next(new AppError(AppMessage.errorMessage.ERROR_EMPTY_LOGIN, 401));
    }

    const user = await User.findOne<UserInterface>({ email }).select(
      "+password"
    );

    if (!user) {
      return next(new AppError(AppMessage.errorMessage.ERROR_WRONG_LOGIN, 401));
    }

    if (!(await user.checkUserPassword(password, user.password))) {
      user.enterWrongPassword();
      await user.save({ validateBeforeSave: false });
      return next(new AppError(AppMessage.errorMessage.ERROR_WRONG_LOGIN, 404));
    }

    if (user.loginFailures) {
      user.loginFailures = undefined;
    }

    if (!user.active) {
      user.active = true;
    }

    await user.save({ validateBeforeSave: false });
    const token = await user.createAndSendToken(res, user.id, user.role);

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
      return next(new AppError(AppMessage.errorMessage.ERROR_EMPTY_EMAIL, 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError(AppMessage.errorMessage.ERROR_WRONG_EMAIL, 400));
    }

    const resetToken = user.createResetRandomToken("password");
    const resetUrl = user.createResetUrl(req, resetToken, "password");

    const emailSend = await EmailManager.send({
      to: user.email,
      subject: emailMessages.subjectEmail.SUBJECT__RESET_FIELD("mot de passe"),
      text: emailMessages.bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    if (!emailSend) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_EMAIL_RESET_PASSWORD,
          500
        )
      );
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_SENT_EMAIL_RESET_PASSWORD(
        user.email
      ),
    });
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
      return next(
        new AppError(AppMessage.errorMessage.ERROR_REQUEST_EXPIRED, 401)
      );
    }
    const { password, passwordConfirm } = req.body;

    user.changeUserPassword(password, passwordConfirm);
    await user.save();

    const token = await user.createAndSendToken(res, user.id, user.role);

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_PASSWORD_MODIFIED,
      token,
    });
  }
);

export const updatePassword = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }

    const { password, newPassword, newPasswordConfirm } = req.body;

    if (!password || !(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_WRONG_PASSWORD, 400)
      );
    }

    user.changeUserPassword(newPassword, newPasswordConfirm);
    await user.save();

    const token = await user.createAndSendToken(res, user.id, user.role);

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_PASSWORD_MODIFIED,
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
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
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
      return next(
        new AppError(AppMessage.errorMessage.ERROR_WRONG_PASSWORD_ROUTE, 400)
      );
    }

    const filteredBody = bodyFilter(req.body, "firstname", "lastname");

    const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      runValidators: true,
    });

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_FIELDS_MODIFIED(
        Object.keys(filteredBody)
      ),
    });
  }
);

export const resetEmail = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }

    const resetToken = user.createResetRandomToken("email");
    const resetUrl = user.createResetUrl(req, resetToken, "email");

    const emailSend = await EmailManager.send({
      to: user.email,
      subject: emailMessages.subjectEmail.SUBJECT__RESET_FIELD("email"),
      text: emailMessages.bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    if (!emailSend) {
      user.emailResetToken = undefined;
      user.emailResetTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(AppMessage.errorMessage.ERROR_SENT_EMAIL_RESET_EMAIL, 500)
      );
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_SENT_EMAIL_RESET_EMAIL(
        user.email
      ),
    });
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
      return next(
        new AppError(AppMessage.errorMessage.ERROR_REQUEST_EXPIRED, 401)
      );
    }

    const { newEmail } = req.body;

    if (!newEmail) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_EMPTY_NEW_EMAIL, 400)
      );
    }

    user.changeUserEmail(newEmail);
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_EMAIL_MODIFIED,
    });
  }
);

export const disableUserAccount = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }

    user.disableAccount();
    await user.save({ validateBeforeSave: false });

    const emailSend = await EmailManager.send({
      to: user.email,
      subject:
        emailMessages.subjectEmail.SUBJECT_MODIFIED_STATUS("Désactivation"),
      text: emailMessages.bodyEmail.ACCOUNT_DISABLED,
    });

    if (!emailSend) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_EMAIL_DISABLE_ACCOUNT,
          500
        )
      );
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_SENT_EMAIL_DISABLE_ACCOUNT(
        user.email
      ),
    });
  }
);
