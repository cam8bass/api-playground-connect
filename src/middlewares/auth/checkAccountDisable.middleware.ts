import { NextFunction, Request, Response } from "express";
import { UserInterface } from "../../shared/interfaces";
import { errorMessage } from "../../shared/messages";
import { catchAsync, AppError } from "../../shared/utils";

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
        new AppError(req, {
          statusCode: 401,
          message: errorMessage.ERROR_LOGIN_REQUIRED,
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
        new AppError(req, {
          statusCode: 403,
          message: errorMessage.ERROR_ACCOUNT_DISABLED,
        })
      );
    }
    next();
  }
);
