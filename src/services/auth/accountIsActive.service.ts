import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import User from "../../models/user.model";
import { UserInterface } from "../../shared/interfaces";
import { warningMessage, errorMessage } from "../../shared/messages";
import AppError from "../../shared/utils/AppError.utils";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
}

/**
 * @description
 * This function is used to find a user by their email.
 * If the user is found, it will be attached to the request object as req.user.
 * If the user is not found or their account is not active, the function will call the next middleware in the stack.
 *
 * @param {CustomRequestInterface} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function in the stack
 *
 * @returns {Promise<void>}
 */
export const findUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const {user:currentUser}=req
    const email = currentUser ? currentUser.email : req.body.email;

    const user = currentUser
      ? currentUser
      : await User.findOne(
          { email },
          "email active activationAccountToken activationAccountTokenExpire disableAccountAt accountDisabled"
        );

    if (!user || user.active) return next();

    if (!user.active) {
      return next(
        new AppError(404, warningMessage.WARNING_INACTIVE_ACCOUNT, {
          request: errorMessage.ERROR_ACCOUNT_NOT_ACTIVE,
        })
      );
    }

    next();
  }
);

/**
 * Check if the user account is active middleware
 */
export const accountIsActive = [findUser];
