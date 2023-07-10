import { Document, Types } from "mongoose";
import { resetType, userRoleType } from "../types/types";
import { Response, Request } from "express";
import { ApiKeyInterface } from "./apiKey.interface";

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
  accountLockedExpire: Date;
  activationAccountAt: Date;

  role: userRoleType;
  loginFailures: number;
  disableAccountAt: Date;
  createAt: Date;
  apiKeys?: Partial<ApiKeyInterface>;

  // METHODS
  activeUserAccount: (
    resetHashToken: string,
    dateExpire: Date
  ) => Promise<void>;
  reactivatedUserAccount: () => Promise<void>;
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
  changeUserEmail: (newEmail: string) => Promise<void>;
  checkEmailChangedAfterToken: (timestampToken: number) => boolean;
  deleteAccountLockedExpire: () => Promise<void>;
}
