import jwt, { SignOptions } from "jsonwebtoken";
import client from "../../infisical";
import { nodeEnvType } from "../types/types";

import { CookieOptions, Response } from "express";
import { JwtPayloadInterface, JwtDecodedInterface } from "../interfaces";

/**
 * Creates a JSON Web Token (JWT) using the provided information.
 * @param payload The payload of the JWT.
 * @param options The options for the JWT.
 */
export async function createJsonWebToken(
  payload: JwtPayloadInterface,
  options: SignOptions
): Promise<string> {
  const { secretValue: jwtSecret } = await client.getSecret("JWT_SECRET");

  const token = jwt.sign(payload, jwtSecret, options);

  return token;
}

/**
 * Sets a JSON Web Token (JWT) as a cookie in the response.
 * @param res - The response object.
 * @param token - The JWT to be set as a cookie.
 */
export async function createJwtCookie(
  res: Response,
  token: string
): Promise<void> {
  const nodeEnv = process.env.NODE_ENV as nodeEnvType;

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
}

/**
 * Decodes a JSON Web Token (JWT) and returns the decoded payload.
 * @param {string} token - The JWT to be decoded. If not specified, the JWT
 *     stored in the "jwt" cookie will be used.
 * @returns {Promise<JwtDecodedInterface>} - The decoded JWT payload.
 */
export async function decodeJsonWebToken(
  token?: string
): Promise<JwtDecodedInterface> {
  const { secretValue: jwtSecret } = await client.getSecret("JWT_SECRET");

  const decoded = jwt.verify(token, jwtSecret) as JwtDecodedInterface;

  return decoded;
}
