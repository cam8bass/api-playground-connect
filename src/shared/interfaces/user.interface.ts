import { Document, ObjectId } from "mongoose";
import { userRoleType } from "../types/types";
import { Response } from "express";

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
  passwordRestTokenExpire: Date;

  active: boolean;
  activationAccountToken: string;
  activationAccountTokenExpire: Date;
  accountLockedExpire: Date;
  activationAccountAt: Date;

  role: userRoleType;
  loginFailures: number;
  // apiKeys

  // METHODS
  createResetRandomToken: () => string;
  activeUserAccount: () => void;
  createAndSendToken: (
    res: Response,
    userId: ObjectId,
    role: userRoleType
  ) => string;
  checkUserPassword: (
    inputPassword: string,
    userPassword: string
  ) => Promise<boolean>;
  enterWrongPassword: () => void;
  checkPasswordChangedAfterToken:(timestampToken:number)=>boolean
}
