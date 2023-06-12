import catchAsync from "../shared/utils/catchAsync.utils";
import { Response, NextFunction } from "express";
import User from "../models/user.model";
import AppError from "../shared/utils/AppError.utils";
import jwt, { JwtPayload } from "jsonwebtoken";
import { userRequestInterface } from "../shared/interfaces";
import { userRoleType } from "../shared/types/types";
import { AppMessage } from "../shared/messages";

export const accountIsLocked = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const email = req.body.email ? req.body.email : req.user.email;

    const user = await User.findOne({ email });

    if (!user || !user.accountLockedExpire) return next();

    if (Date.now() > Date.parse(user.accountLockedExpire.toString())) {
      user.accountLockedExpire = undefined;
      await user.save({ validateBeforeSave: false });
      next();
    } else {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_ACCOUNT_LOCKED, 401)
      );
    }
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
    }
    if (!token) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    const user = await User.findOne({
      _id: decoded.id,
    });

    if (!user || user.checkPasswordChangedAfterToken(decoded.iat)) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }

    if (!user.active) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_ACCOUNT_LOCKED, 401)
      );
    }

    req.user = user;

    next();
  }
);

export const restrictTo = (...userRole: userRoleType[]) =>
  catchAsync(
    async (req: userRequestInterface, res: Response, next: NextFunction) => {
      if (!userRole.includes(req.user.role)) {
        return next(
          new AppError(AppMessage.errorMessage.ERROR_ACCESS_DENIED, 401)
        );
      }

      next();
    }
  );
