import { NextFunction, Request, Response } from "express";
import { UserInterface } from "../../shared/interfaces";
import { warningMessage, errorMessage } from "../../shared/messages";
import { catchAsync, AppError } from "../../shared/utils";


interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
}

/**
 * Check if user is logged in
 * @param {CustomRequestInterface} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const checkUserIsLoggedIn = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;
    if (!currentUser) {
      return next(
        new AppError(401, warningMessage.WARNING_TOKEN, {
          request: errorMessage.ERROR_LOGIN_REQUIRED,
        })
      );
    }
    next();
  }
);

/**
 * Check if account is locked
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const checkIfAccountIsLocked = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    if (currentUser.accountLocked && currentUser.accountLockedExpire) {
      const accountIsLocked =
        Date.parse(currentUser.accountLockedExpire.toString()) > Date.now();

      if (accountIsLocked) {
        return next(
          new AppError(401, warningMessage.WARNING_ACCOUNT_BLOCKED, {
            request: errorMessage.ERROR_ACCOUNT_LOCKED,
          })
        );
      }
    }

    next();
  }
);
