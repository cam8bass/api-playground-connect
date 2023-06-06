import { NextFunction, Request, Response } from "express";
import User from "./../models/user.model";
import SendEmail from "../shared/utils/sendEmail.utils";
import { emailMessage, emailSubject } from "../shared/messages/email.messages";

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    console.log("erreur envoi email ");
    // retourner une erreur à l'utilisateur
  }

  res.status(200).json({
    status: "success",
    message: `Un email de confirmation a été envoyé à ${user.email}. Veuillez vérifier votre boîte de réception pour activer votre compte.`,
  });
};

export const activationAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};

export const changeEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};

export const confirmChangeEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
