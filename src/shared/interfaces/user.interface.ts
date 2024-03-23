import { Document, Types } from "mongoose";
import { resetType, userRoleType } from "../types/types";
import { Response, Request } from "express";

export interface UserInterface extends Document {
  firstname: string;
  lastname: string;

  email: string;
  emailChangeAt: Date;
  emailToken: string;
  emailTokenExpire: Date;

  password: string;
  passwordConfirm: string;
  passwordChangeAt: Date;
  passwordToken: string;
  passwordTokenExpire: Date;

  active: boolean;
  activationAccountAt: Date;
  activationToken: string;
  activationTokenExpire: Date;

  accountLocked: boolean;
  accountLockedExpire: Date;

  disableAccountAt: Date;
  accountDisabled: boolean;

  role: userRoleType;
  loginFailures: number;
  createdAt: Date;
  updatedAt: Date;

  // METHODS

  saveActivationToken: (
    resetHashToken: string,
    dateExpire: Date
  ) => Promise<void>;
  savePasswordToken: (
    resetHashToken: string,
    dateExpire: Date
  ) => Promise<void>;
  deleteActivationToken: () => Promise<void>;
  deletePasswordToken: () => Promise<void>;

  checkPasswordChangedAfterToken: (timestampToken: number) => boolean;
  createResetUrl: (
    req: Request,
    resetToken: string,
    resetType: resetType
  ) => string;

  deleteEmailToken: () => Promise<void>;
  checkEmailChangedAfterToken: (timestampToken: number) => boolean;
  updateLoginFailure: (passwordIsCorrect: boolean) => Promise<void>;
  unlockAccount: () => Promise<void>;
  lockAccount: () => Promise<void>;
  checkUserPassword: (
    inputPassword: string,
    userPassword: string
  ) => Promise<boolean>;
  changeUserPassword: (
    newPassword: string,
    newPasswordConfirm: string
  ) => Promise<void>;
}
