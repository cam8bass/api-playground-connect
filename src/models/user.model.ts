import { ObjectId, Schema, model } from "mongoose";
import { UserInterface } from "../shared/interfaces";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { nodeEnv, resetType, userRoleType } from "../shared/types/types";
import { CookieOptions, Request, Response } from "express";

const userSchema = new Schema<UserInterface>({
  // USER
  firstname: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, "Le champ prénom est obligatoire"],
    minlength: [3, "Le champ prénom doit contenir au minimum 3 caractères"],
    maxlength: [15, "Le champ prénom doit contenir au maximum 15 caractères"],
    validate: [
      validator.isAlpha,
      "Le champ prénom doit comporter uniquement des lettres",
    ],
  },
  lastname: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, "Le champ nom est obligatoire"],
    minlength: [3, "Le champ nom doit contenir au minimum 3 caractères"],
    maxlength: [15, "Le champ nom doit contenir au maximum 15 caractères"],
    validate: [
      validator.isAlpha,
      "Le champ nom doit comporter uniquement des lettres",
    ],
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  // EMAIL
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: [true, "Le champ email est obligatoire"],
    unique: true,
    validate: [
      validator.isEmail,
      "Veuillez renseigner une adresse email valide",
    ],
  },
  emailChangeAt: { type: Date },
  emailResetToken: { type: String },
  emailResetTokenExpire: { type: Date },
  // PASSWORD
  password: {
    type: String,
    trim: true,
    required: [true, "Le champ mot de passe est obligtoire"],
    validate: [
      validator.isStrongPassword,
      "Le champ mot de passe doit contenir au minimum une lettre minuscule, une majuscule, un chiffre, un caractère spécial et avoir une longueur minimale de 8 caractères.",
    ],
    maxlength: [
      30,
      "Le champ mot de passe doit faire au miximum 30 caractères",
    ],
    select: false,
  },
  passwordConfirm: {
    type: String,
    trim: true,
    required: [true, "Le champ mot de passe de confirmation est obligatoire"],
    validate: {
      validator: function (this: UserInterface): boolean {
        return this.password === this.passwordConfirm;
      },
      message:
        "Le mot de passe de confirmation doit être identique au mot de passe",
    },
  },
  passwordChangeAt: { type: Date },
  passwordResetToken: { type: String },
  passwordResetTokenExpire: { type: Date },
  // ACCOUNT
  active: {
    type: Boolean,
    default: false,
  },
  activationAccountToken: { type: String },
  activationAccountTokenExpire: { type: Date },
  activationAccountAt: { type: Date },
  accountLockedExpire: { type: Date },
  // OTHERS
  loginFailures: {
    type: Number,
    default: 0,
  },
  disableAccountAt: { type: Date },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.createResetRandomToken = function (
  this: UserInterface,
  resetType: resetType
): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetHashToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const dateExpire = new Date(Date.now() + 10 * 60 * 1000);

  if (resetType === "activation") {
    this.activationAccountToken = resetHashToken;
    this.activationAccountTokenExpire = dateExpire;
  } else if (resetType === "password") {
    this.passwordResetToken = resetHashToken;
    this.passwordResetTokenExpire = dateExpire;
  } else if (resetType === "email") {
    this.emailResetToken = resetHashToken;
    this.emailResetTokenExpire = dateExpire;
  }

  return resetToken;
};

userSchema.methods.activeUserAccount = function (this: UserInterface) {
  this.active = true;
  this.activationAccountToken = undefined;
  this.activationAccountTokenExpire = undefined;
};

userSchema.methods.createAndSendToken = function (
  res: Response,
  userId: ObjectId,
  role: userRoleType
): string {
  const nodeEnv = process.env.NODE_ENV as nodeEnv;

  const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  const cookieOptions: CookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: false,
  };

  if (nodeEnv === "production") {
    cookieOptions.secure = true;
  }

  res.cookie("jwt", token, cookieOptions);
  return token;
};

userSchema.methods.checkUserPassword = async function (
  inputPassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(inputPassword, userPassword);
};

userSchema.methods.enterWrongPassword = function (this: UserInterface): void {
  this.loginFailures++;
  if (this.loginFailures >= 3) {
    // this.accountLockedExpire = new Date(Date.now() + 1 * 60 * 60 * 1000);
    this.accountLockedExpire = new Date(Date.now() + 20 * 1000);

    this.loginFailures = undefined;
  }
};

userSchema.methods.checkPasswordChangedAfterToken = function (
  this: UserInterface,
  tokenTimestamp: number
): boolean {
  if (this.passwordChangeAt) {
    return Date.parse(this.passwordChangeAt.toString()) / 1000 > tokenTimestamp;
  }
  return false;
};

userSchema.methods.createResetUrl = (
  req: Request,
  resetToken: string,
  resetType: resetType
): string => {
  let path: string | undefined;
  if (resetType === "activation") {
    path = "activationAccount";
  } else if (resetType === "password") {
    path = "resetPassword";
  } else if (resetType === "email") {
    path = "resetEmail";
  }
  return `${req.headers.host}${req.baseUrl}/${path}/${resetToken}`;
};

userSchema.methods.changeUserPassword = function (
  this: UserInterface,
  newPassword: string,
  newPasswordConfirm: string
) {
  this.password = newPassword;
  this.passwordConfirm = newPasswordConfirm;
  this.passwordChangeAt = new Date(Date.now());
  this.passwordResetToken = undefined;
  this.passwordResetTokenExpire = undefined;
};

userSchema.methods.changeUserEmail = function (
  this: UserInterface,
  newEmail: string
): void {
  this.email = newEmail;
  this.emailResetToken = undefined;
  this.emailResetTokenExpire = undefined;
  this.emailChangeAt = new Date(Date.now());
};

userSchema.methods.disableAccount = function (this: UserInterface) {
  this.active = false;
  this.disableAccountAt = new Date(Date.now());
};

const User = model<UserInterface>("User", userSchema);

export default User;