import crypto from "crypto";
import { resetType } from "../types/types";
import { Request } from "express";

export const createResetRandomToken = (): {
  resetToken: string;
  resetHashToken: string;
  dateExpire: Date;
} => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetHashToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const dateExpire = new Date(Date.now() + 10 * 60 * 1000);
  return { resetToken, resetHashToken, dateExpire };
};

export const createHashRandomToken = (resetToken: string): string => {
  return crypto.createHash("sha256").update(resetToken).digest("hex");
};

export const createResetUrl = (
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
  } else if (resetType === "apiKey") {
    path = "confirmRenewal";
  }
  return `${req.headers.host}${req.baseUrl}/${path}/${resetToken}`;
};


