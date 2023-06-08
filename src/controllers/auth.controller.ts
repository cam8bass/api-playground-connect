import catchAsync from "../shared/utils/catchAsync.utils";
import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import {
  ACCOUNT_LOCKED,
  USER_PROTECT,
  USER_RESTRICT,
} from "../shared/messages";
import AppError from "../shared/utils/AppError.utils";
import jwt, { JwtPayload } from "jsonwebtoken";
import { userRequestInterface } from "../shared/interfaces";
import { userRoleType } from "../shared/types/types";

export const accountIsLocked = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    if (!req.body.email) req.body.email = req.user.email;

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user || !user.accountLockedExpire) return next();

    if (Date.now() > Date.parse(user.accountLockedExpire.toString())) {
      user.accountLockedExpire = undefined;
      await user.save({ validateBeforeSave: false });
      next();
    } else {
      return next(new AppError(ACCOUNT_LOCKED, 401));
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
      return next(new AppError(USER_PROTECT, 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    const user = await User.findOne({
      _id: decoded.id,
    });

    if (!user || user.checkPasswordChangedAfterToken(decoded.iat)) {
      return next(new AppError(USER_PROTECT, 401));
    }

    req.user = user;

    next();
  }
);

export const restrictTo = (...userRole: userRoleType[]) =>
  catchAsync(
    async (req: userRequestInterface, res: Response, next: NextFunction) => {
      if (!userRole.includes(req.user.role)) {
        return next(new AppError(USER_RESTRICT, 401));
      }

      next();
    }
  );
