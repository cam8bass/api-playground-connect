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

    // OTHERS
    loginFailures: {
      type: Number,
      default: 0,
    },
    disableAccountAt: { type: Date },

    accountDisabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    id: false,
    timestamps: true,
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

/**
 * Sets the passwordChangeAt field to the current date and time minus one second, if the password field has been modified or if the document is new.
 * @param {Query} this - The query object.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

/**
 * Sets the passwordChangeAt field to the current date and time minus one second, if the password field has been modified or if the document is new.
 * @param {Query} this - The query object.
 */
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }
  const dateNow = Date.now() - 1000;
  this.passwordChangeAt = new Date(dateNow);
  next();
});

/**
 * Creates and sends a JSON Web Token (JWT) to the user.
 * @param {Response} res - The response object.
 * @param {Types.ObjectId} userId - The ID of the user.
 * @param {userRoleType} role - The role of the user.
 */
userSchema.methods.createAndSendToken = async function (
  res: Response,
  userId: Types.ObjectId,
  role: userRoleType
): Promise<void> {
  const nodeEnv = process.env.NODE_ENV as nodeEnv;
  const { secretValue: jwtSecret } = await client.getSecret("JWT_SECRET");

  /**
   * Creates a JSON Web Token (JWT) using the provided information.
   * @param {object} payload - The payload of the JWT.
   * @param {string} secret - The secret used to sign the JWT.
   * @param {object} options - The options for the JWT.
   */
  const token = jwt.sign({ id: userId, role }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  /**
   * Sets the options for the cookie containing the JWT.
   * @property {Date} expires - The expiration date of the cookie.
   * @property {boolean} httpOnly - Indicates whether the cookie can be accessed by JavaScript.
   * @property {string} domain - The domain of the cookie.
   * @property {string} path - The path of the cookie.
   */
  const cookieOptions: CookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    domain: "localhost",
    path: "/",
  };

  /**
   * Sets the secure and sameSite properties of the cookie if the environment is production.
   */
  if (nodeEnv === "production") {
    cookieOptions.secure = true;
    cookieOptions.sameSite = "strict";
  }

  /**
   * Sets the JWT as a cookie with the specified options.
   * @param {string} name - The name of the cookie.
   * @param {string} value - The value of the cookie.
   * @param {CookieOptions} options - The options for the cookie.
   */
  res.cookie("jwt", token, cookieOptions);
};

/**
 * Updates the user's account activation information.
 * @param {string} resetHashToken - The activation token.
 * @param {Date} dateExpire - The expiration date of the token.
 */
userSchema.methods.prepareAccountActivation = async function (
  this: UserInterface,
  resetHashToken: string,
  dateExpire: Date
): Promise<void> {
  await this.updateOne({
    activationAccountToken: resetHashToken,
    activationAccountTokenExpire: new Date(dateExpire),
  });
};

/**
 * Deletes the activation account token from the user document.
 * @param {UserInterface} this - The user document.
 */
userSchema.methods.deleteActivationToken = async function (
  this: UserInterface
): Promise<void> {
  await this.updateOne({
    $unset: { activationAccountToken: "", activationAccountTokenExpire: "" },
  });
};

/**
 * Deletes the password reset token from the user document.
 * @param {UserInterface} this - The user document.
 */
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

/**
 * Deletes the email reset token from the user document.
 * @param {UserInterface} this - The user document.
 */
userSchema.methods.deleteEmailResetToken = async function (
  this: UserInterface
) {
  await this.updateOne({
    $unset: { emailResetToken: "", emailResetTokenExpire: "" },
  });
};

/**
 * Checks if the input password matches the user's password.
 * @param {string} inputPassword - The input password.
 * @param {string} userPassword - The user's password.
 * @returns {boolean} `true` if the input password matches the user's password, `false` otherwise.
 */
userSchema.methods.checkUserPassword = async function (
  inputPassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(inputPassword, userPassword);
};

/**
 * Locks the user's account.
 * @param {UserInterface} this - The user document.
 */
userSchema.methods.lockAccount = async function (this: UserInterface) {
  await this.updateOne({
    $set: {
      accountLockedExpire: new Date(Date.now() + 1 * 60 * 60 * 1000),
      accountLocked: true,
    },
    $unset: { loginFailures: "" },
  });
};

/**
 * Unlocks the user's account.
 * @param {UserInterface} this - The user document.
 */
userSchema.methods.unlockAccount = async function (this: UserInterface) {
  await this.updateOne({
    $set: {
      accountLocked: false,
    },
    $unset: { accountLockedExpire: "", loginFailures: "" },
  });
};

/**
 * Updates the user's login failure information.
 * @param {boolean} passwordIsCorrect - Indicates whether the password was correct.
 */
userSchema.methods.updateLoginFailure = async function (
  this: UserInterface,
  passwordIsCorrect: boolean
): Promise<void> {
  if (passwordIsCorrect) {
    this.loginFailures = undefined;
  } else {
    this.loginFailures++;
  }
  await this.save({ validateBeforeSave: false });
};



/**
 * Checks if the user's password was changed after the given timestamp.
 * @param {number} tokenTimestamp - The timestamp of the password change token.
 * @returns {boolean} `true` if the password was changed after the given timestamp, `false` otherwise.
 */
userSchema.methods.checkPasswordChangedAfterToken = function (
  this: UserInterface,
  tokenTimestamp: number
): boolean {
  if (this.passwordChangeAt) {
    return Date.parse(this.passwordChangeAt.toString()) / 1000 > tokenTimestamp;
  }
  return false;
};

/**
 * Checks if the user's email was changed after the given timestamp.
 * @param {number} tokenTimestamp - The timestamp of the email change token.
 * @returns {boolean} `true` if the email was changed after the given timestamp, `false` otherwise.
 */
userSchema.methods.checkEmailChangedAfterToken = function (
  this: UserInterface,
  tokenTimestamp: number
): boolean {
  if (this.emailChangeAt) {
    return Date.parse(this.emailChangeAt.toString()) / 1000 > tokenTimestamp;
  }
  return false;
};

/**
 * Creates a reset URL for the user.
 * @param {Request} req - The request object.
 * @param {string} resetToken - The reset token.
 * @param {resetType} resetType - The type of reset.
 * @returns {string} The reset URL.
 */
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

/**
 * Changes the user's password.
 * @param {string} newPassword - The new password.
 * @param {string} newPasswordConfirm - The new password confirmation.
 */
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
