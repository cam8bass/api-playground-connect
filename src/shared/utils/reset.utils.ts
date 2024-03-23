import crypto from "crypto";
import { resetType } from "../types/types";
import { Request } from "express";


/**
 * Creates a reset URL for the given reset token and type
 * @param {Request} req - the request object
 * @param {string} resetToken - the reset token
 * @param {resetType} resetType - the type of reset
 * @returns {string} the reset URL
 */
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
