import catchAsync from "../shared/utils/catchAsync.utils";
import { Response, NextFunction } from "express";
import User from "../models/user.model";
import AppError from "../shared/utils/AppError.utils";
import jwt, { JwtPayload } from "jsonwebtoken";
import { userRequestInterface } from "../shared/interfaces";
import { userRoleType } from "../shared/types/types";
import client from "../infisical";
import { errorMessage, warningMessage } from "../shared/messages";
import { formatUserResponse } from "../shared/utils/formatResponse.utils";

export const accountIsActive = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const email = req.user ? req.user.email : req.body.email;

    const user = req.user
      ? req.user
      : await User.findOne(
          { email },
          "email active activationAccountToken activationAccountTokenExpire disableAccountAt"
        );

    if (!user || user.active) return next();

    if (!user.active) {
      return next(
        new AppError(404, warningMessage.WARNING_INACTIVE_ACCOUNT, {
          request: errorMessage.ERROR_ACCOUNT_NOT_ACTIVE,
        })
      );
    }
  }
);

export const accountIsLocked = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const email = req.user ? req.user.email : req.body.email;

    const user = req.user
      ? req.user
      : await User.findOne({ email }, "accountLockedExpire accountLocked");

    if (!user || (!user.accountLockedExpire && !user.accountLocked))
      return next();

    const accountIsLocked =
      Date.parse(user.accountLockedExpire.toString()) > Date.now();

    if (accountIsLocked) {
      return next(
        new AppError(401, warningMessage.WARNING_ACCOUNT_BLOCKED, {
          request: errorMessage.ERROR_ACCOUNT_LOCKED,
        })
      );
    }

    await user.deleteAccountLockedExpire();

    next();
  }
);

export const protect = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
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
    const { secretValue: jwtSecret } = await client.getSecret("JWT_SECRET");

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

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

    req.user =  user;

    next();
  }
);

export const restrictTo = (...userRole: userRoleType[]) =>
  catchAsync(
    async (req: userRequestInterface, res: Response, next: NextFunction) => {
      if (!userRole.includes(req.user.role)) {
        return next(
          new AppError(401, warningMessage.WARNING_TOKEN, {
            request: errorMessage.ERROR_ACCESS_DENIED,
          })
        );
      }

      next();
    }
  );
