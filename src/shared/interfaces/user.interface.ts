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
  accountLockedExpire: Date;
  activationAccountAt: Date;

  role: userRoleType;
  loginFailures: number;
  disableAccountAt: Date;

  apiKeys?: [
    {
      apiKeys?: [
        {
          apiName?: string;
          apiKey?: string;
          apiKeyExpire?: Date;
          _id?: Types.ObjectId;
          active?: boolean;
        }
      ];
    }
  ];
  // METHODS

  createAndSendToken: (
    res: Response,
    userId: Types.ObjectId,
    role: userRoleType
  ) => Promise<string>;
  checkUserPassword: (
    inputPassword: string,
    userPassword: string
  ) => Promise<boolean>;
  enterWrongPassword: () => void;
  checkPasswordChangedAfterToken: (timestampToken: number) => boolean;
  createResetUrl: (
    req: Request,
    resetToken: string,
    resetType: resetType
  ) => string;
  changeUserPassword: (newPassword: string, newPasswordConfirm: string) => void;
}
