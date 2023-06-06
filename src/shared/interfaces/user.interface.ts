import { Document } from "mongoose";
import { userRoleType } from "../types/types";

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

  createResetRandomToken: () => string;
}
