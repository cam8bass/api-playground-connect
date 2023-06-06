import { Schema, model } from "mongoose";
import { UserInterface } from "../shared/interfaces";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";

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
  // emailChangeAt: {},
  // emailResetToken: {},
  // emailResetTokenExpire: {},
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
  // passwordChangeAt: {},
  // passwordResetToken: {},
  // passwordRestTokenExpire: {},
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
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.createResetRandomToken = function (this: UserInterface): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetHashToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.activationAccountToken = resetHashToken;
  this.activationAccountTokenExpire = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
};

const User = model<UserInterface>("User", userSchema);

export default User;
