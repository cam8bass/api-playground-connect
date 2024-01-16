import { NextFunction } from "express";
import {
  accountIsActiveServices,
  accountIsLockedServices,
  protectServices,
} from "../services/auth";
import { UserInterface } from "../shared/interfaces";
import { warningMessage, errorMessage } from "../shared/messages";
import { userRoleType } from "../shared/types/types";
import AppError from "../shared/utils/AppError.utils";
import catchAsync from "../shared/utils/catchAsync.utils";
/**
 * Check if the user account is active middleware
 */
export const accountIsActive = [accountIsActiveServices.findUser];

/**
 * Account is locked middleware
 */
export const accountIsLocked = [
  accountIsLockedServices.findUser,
  accountIsLockedServices.checkIfAccountIsLocked,
  accountIsLockedServices.deleteLockedExpire,
];

/**
 * middleware to protect routes that require authentication
 */
export const protect = [
  protectServices.checkTokenExistence,
  protectServices.verifyAndDecodeToken,
  protectServices.findAndCheckUser,
];



interface CustomRequestInterface extends Request {
  user?: UserInterface;
}

/**
 * @description
 * middleware to check if user role is in the allowed roles
 * @param {...userRoleType[]} userRole - Array of allowed user roles.
 * @returns {Function} middleware function
 */
export const restrictTo = (...userRole: userRoleType[]) =>
  catchAsync(
    async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
      const { user } = req;
      if (!userRole.includes(user.role)) {
        return next(
          new AppError(401, warningMessage.WARNING_TOKEN, {
            request: errorMessage.ERROR_ACCESS_DENIED,
          })
        );
      }

      next();
    }
  );

