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
  ACCOUNT_LOCKED,
} from "../shared/messages";
import crypto from "crypto";
import AppError from "../shared/utils/AppError.utils";
import { UserInterface } from "../shared/interfaces";

export const accountIsLocked = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user.accountLockedExpire) return next();

    if (Date.now() > Date.parse(user.accountLockedExpire.toString())) {
      user.accountLockedExpire = undefined;
      await user.save({ validateBeforeSave: false });
      next();
    } else {
      return next(new AppError(ACCOUNT_LOCKED, 401));
    }
  }
);

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

    const resetToken = user.createResetRandomToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.headers.host}${req.baseUrl}/activationAccount/${resetToken}`;

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
      await user.save({ validateBeforeSave: false }); //# a voir
      return next(new AppError(WRONG_LOGIN, 404));
    }

    const token = user.createAndSendToken(res, user.id, user.role);

    res.status(200).json({
      status: "success",
      token,
    });
  }
);

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const changeEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const confirmChangeEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);
