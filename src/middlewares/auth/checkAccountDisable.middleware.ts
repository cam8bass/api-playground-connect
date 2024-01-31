import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import { UserInterface } from "../../shared/interfaces";
import { warningMessage, errorMessage } from "../../shared/messages";
import AppError from "../../shared/utils/AppError.utils";

interface CustomRequestInterface extends Request {
  currentUser: UserInterface;
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
 * Check if user is disable
 * @param {CustomRequestInterface} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const checkUserIsDisable = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;
    if (currentUser.disableAccountAt && currentUser.accountDisabled) {
      return next(
        new AppError(404, warningMessage.WARNING_ACCOUNT_DISABLED, {
          request: errorMessage.ERROR_ACCOUNT_DISABLED,
        })
      );
    }
    next();
  }
);
