import { Types, Schema, model, Query } from "mongoose";
import { CustomQuery, UserInterface } from "../shared/interfaces";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { nodeEnv, resetType, userRoleType } from "../shared/types/types";
import { CookieOptions, Request, Response } from "express";

import client from "../infisical";
import { validationMessage } from "../shared/messages";

const userSchema = new Schema<UserInterface>(
  {
    // USER
    firstname: {
      type: String,
      lowercase: true,
      trim: true,
      required: [true, validationMessage.VALIDATE_REQUIRED_FIELD("prénom")],
      minlength: [3, validationMessage.VALIDATE_MIN_LENGTH("prenom", 3)],
      maxlength: [15, validationMessage.VALIDATE_MAX_LENGTH("prénom", 15)],
      validate: [
        validator.isAlpha,
        validationMessage.VALIDATE_ONLY_STRING("prénom"),
      ],
    },
    lastname: {
      type: String,
      lowercase: true,
      trim: true,
      required: [true, validationMessage.VALIDATE_REQUIRED_FIELD("nom")],
      minlength: [3, validationMessage.VALIDATE_MIN_LENGTH("nom", 3)],
      maxlength: [15, validationMessage.VALIDATE_MAX_LENGTH("nom", 15)],
      validate: [
        validator.isAlpha,
        validationMessage.VALIDATE_ONLY_STRING("nom"),
      ],
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin"],
        message: validationMessage.VALIDATE_FIELD("un role"),
      },
      default: "user",
    },
    // EMAIL
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, validationMessage.VALIDATE_REQUIRED_FIELD("email")],
      unique: true,
      validate: [
        validator.isEmail,
        validationMessage.VALIDATE_FIELD("une adresse email"),
      ],
    },
    emailChangeAt: { type: Date },
    emailResetToken: { type: String },
    emailResetTokenExpire: { type: Date },
    // PASSWORD
    password: {
      type: String,
      trim: true,
      required: [
        true,
        validationMessage.VALIDATE_REQUIRED_FIELD("mot de passe"),
      ],
      validate: [
        validator.isStrongPassword,
        validationMessage.VALIDATE_PASSWORD(8),
      ],
      maxlength: [
        30,
        validationMessage.VALIDATE_MAX_LENGTH("mot de passe", 30),
      ],
      select: false,
    },
    passwordConfirm: {
      type: String,
      trim: true,
      required: [
        true,
        validationMessage.VALIDATE_REQUIRED_FIELD(
          "mot de passe de confirmation"
        ),
      ],
      validate: {
        validator: function (this: UserInterface): boolean {
          return this.password === this.passwordConfirm;
        },
        message: validationMessage.VALIDATE_PASSWORD_CONFIRM,
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

    accountLocked: {
      type: Boolean,
      default: false,
    },
    createAt: {
      type: Date,
      default: Date.now(),
    },
    // OTHERS
    loginFailures: {
      type: Number,
      default: 0,
    },
    disableAccountAt: { type: Date },
  },
  {
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ email: 1 }, { unique: true });

userSchema.pre<Query<UserInterface[], UserInterface> & CustomQuery>(
  /^find/,
  function (next) {
    this.select("-__v");
    next();
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }
  const dateNow = Date.now() - 1000;
  this.passwordChangeAt = new Date(dateNow);
  next();
});

userSchema.methods.createAndSendToken = async function (
  res: Response,
  userId: Types.ObjectId,
  role: userRoleType
): Promise<void> {
  const nodeEnv = process.env.NODE_ENV as nodeEnv;
  const { secretValue: jwtSecret } = await client.getSecret("JWT_SECRET");

  const token = jwt.sign({ id: userId, role }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  const cookieOptions: CookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    domain: "localhost",
    path: "/",
  };

  if (nodeEnv === "production") {
    cookieOptions.secure = true;
    cookieOptions.sameSite = "strict";
  }

  res.cookie("jwt", token, cookieOptions);
};

userSchema.methods.prepareAccountActivation = async function (
  this: UserInterface,
  resetHashToken: string,
  dateExpire: Date
): Promise<void> {
  await this.updateOne({
    activationAccountToken: resetHashToken,
    activationAccountTokenExpire: dateExpire,
  });
};



userSchema.methods.deleteActivationToken = async function (
  this: UserInterface
): Promise<void> {
  await this.updateOne({
    $unset: { activationAccountToken: "", activationAccountTokenExpire: "" },
  });
};

userSchema.methods.deletePasswordResetToken = async function (
  this: UserInterface
): Promise<void> {
  await this.updateOne({
    $unset: {
      passwordResetToken: "",
      passwordResetTokenExpire: "",
    },
  });
};

userSchema.methods.deleteEmailResetToken = async function (
  this: UserInterface
) {
  await this.updateOne({
    $unset: { emailResetToken: "", emailResetTokenExpire: "" },
  });
};

userSchema.methods.deleteAccountLockedExpire = async function (
  this: UserInterface
): Promise<void> {
  await this.updateOne({
    $set: { accountLocked: false },
    $unset: {
      accountLockedExpire: "",
    },
  });
};

userSchema.methods.checkUserPassword = async function (
  this: UserInterface,
  inputPassword: string,
  userPassword: string
): Promise<boolean> {
  const validPassword = await bcrypt.compare(inputPassword, userPassword);

  if (!validPassword) {
    this.loginFailures++;

    if (this.loginFailures >= 5) {
      this.accountLockedExpire = new Date(Date.now() + 1 * 60 * 60 * 1000);
      this.accountLocked = true;
      this.loginFailures = undefined;
    }

    await this.save({ validateBeforeSave: false });
    return false;
  } else {
    if (this.loginFailures !== 0) {
      this.loginFailures = undefined;
    }

    if (this.accountLocked) this.accountLocked = false;
    await this.save({ validateBeforeSave: false });
    return true;
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

userSchema.methods.checkEmailChangedAfterToken = function (
  this: UserInterface,
  tokenTimestamp: number
): boolean {
  if (this.emailChangeAt) {
    return Date.parse(this.emailChangeAt.toString()) / 1000 > tokenTimestamp;
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

userSchema.methods.changeUserPassword = async function (
  this: UserInterface,
  newPassword: string,
  newPasswordConfirm: string
): Promise<void> {
  this.password = newPassword;
  this.passwordConfirm = newPasswordConfirm;

  this.passwordResetToken = undefined;
  this.passwordResetTokenExpire = undefined;

  await this.save();
};

const User = model<UserInterface>("User", userSchema);

export default User;
