import { NextFunction, Request, Response } from "express";
import { UserInterface } from "../../shared/interfaces";
import { warningMessage, errorMessage } from "../../shared/messages";
import { userRoleType } from "../../shared/types/types";
import AppError from "../../shared/utils/AppError.utils";
import catchAsync from "../../shared/utils/catchAsync.utils";

interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
}

/**
 * @description
 * middleware to check if user role is in the allowed roles
 * @param {...userRoleType[]} userRole - Array of allowed user roles.
 * @returns {Function} middleware function
 */
export const checkUserRole = (...userRole: userRoleType[]) =>
  catchAsync(
    async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
      const { currentUser } = req;
      if (!userRole.includes(currentUser.role)) {
        return next(
          new AppError(401, warningMessage.WARNING_TOKEN, {
            request: errorMessage.ERROR_ACCESS_DENIED,
          })
        );
      }

      next();
    }
  );

// /**
//  * @description
//  * middleware to restrict routes by role
//  */
export const restrictTo = (...userRole: userRoleType[]) => [
  checkUserRole(...userRole),
];
