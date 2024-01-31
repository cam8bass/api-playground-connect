import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import client from "../../infisical";
import User from "../../models/user.model";
import catchAsync from "../../shared/utils/catchAsync.utils";
import { warningMessage, errorMessage } from "../../shared/messages";
import AppError from "../../shared/utils/AppError.utils";

import { UserInterface } from "../../shared/interfaces";

interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
  token?: string;
  decoded?: jwt.JwtPayload;
}

/**
 * middleware to check if the token exists in the request
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @returns {Promise<void>} - returns a promise that resolves when the middleware completes
 */
export const checkTokenExistence = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split("Bearer ").at(1);
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError(401, warningMessage.WARNING_TOKEN, {
          request: errorMessage.ERROR_LOGIN_REQUIRED,
        })
      );
    }
    req.token = token;

    next();
  }
);

/**
 * middleware to verify and decode the token in the request
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @returns {Promise<void>} - returns a promise that resolves when the middleware completes
 */
export const verifyAndDecodeToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { token } = req;
    const { secretValue: jwtSecret } = await client.getSecret("JWT_SECRET");

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    req.decoded = decoded;
    next();
  }
);

/**
 * middleware to find and check the user based on the decoded token
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @returns {Promise<void>} - returns a promise that resolves when the middleware completes
 */
export const findAndCheckUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { decoded } = req;
    const user = await User.findOne({
      _id: decoded.id,
    });

    if (
      !user ||
      user.checkPasswordChangedAfterToken(decoded.iat) ||
      user.checkEmailChangedAfterToken(decoded.iat)
    ) {
      return next(
        new AppError(401, warningMessage.WARNING_TOKEN, {
          request: errorMessage.ERROR_LOGIN_REQUIRED,
        })
      );
    }

    req.currentUser = user;

    next();
  }
);

