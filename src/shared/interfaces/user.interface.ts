import { Document, Types } from "mongoose";
import { resetType, userRoleType } from "../types/types";
import { Response, Request } from "express";

export interface UserInterface extends Document {
  firstname: string;
  lastname: string;
  email: string;
  emailChangeAt: Date;
  emailResetToken: string;
  emailResetTokenExpire: Date;

  password: string;
  passwordConfirm: string;
  passwordChangeAt: Date;
  passwordResetToken: string;
  passwordResetTokenExpire: Date;

  active: boolean;
  activationAccountToken: string;
  activationAccountTokenExpire: Date;
  activationAccountAt: Date;

  accountLocked: boolean;
  accountLockedExpire: Date;

  role: userRoleType;
  loginFailures: number;
  disableAccountAt: Date;
  createAt: Date;

  // METHODS

  prepareAccountActivation: (
    resetHashToken: string,
    dateExpire: Date
  ) => Promise<void>;

  createAndSendToken: (
    res: Response,
    userId: Types.ObjectId,
    role: userRoleType
  ) => Promise<string>;
  deleteActivationToken: () => Promise<void>;
  deletePasswordResetToken: () => Promise<void>;
  checkUserPassword: (
    inputPassword: string,
    userPassword: string
  ) => Promise<boolean>;
  checkPasswordChangedAfterToken: (timestampToken: number) => boolean;
  createResetUrl: (
    req: Request,
    resetToken: string,
    resetType: resetType
  ) => string;
  changeUserPassword: (
    newPassword: string,
    newPasswordConfirm: string
  ) => Promise<void>;
  deleteEmailResetToken: () => Promise<void>;

  checkEmailChangedAfterToken: (timestampToken: number) => boolean;
  deleteAccountLockedExpire: () => Promise<void>;
}
