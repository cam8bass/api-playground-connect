import { NextFunction, Request, Response } from "express";
import { UserInterface, NotificationDetailInterface } from "../../../shared/interfaces";
import { warningMessage, errorMessage } from "../../../shared/messages";
import { notificationMessage } from "../../../shared/messages/notification.message";
import { catchAsync, AppError } from "../../../shared/utils";
import { Notification } from "../../../models";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  accountIsLocked?: boolean;
  notification?: NotificationDetailInterface[];
  passwordIsCorrect?: boolean;
  accountIsUnlocked?: boolean;
}

/**
 * Check if account is locked
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const checkIfAccountIsLocked = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;

    if (user.accountLocked && user.accountLockedExpire) {
      const accountIsLocked =
        Date.parse(user.accountLockedExpire.toString()) > Date.now();

      req.accountIsLocked = accountIsLocked;
    }

    next();
  }
);

/**
 * Unlocks an account.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>}
 */
export const unlockAccount = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, accountIsLocked } = req;
    if (user.accountLocked && user.accountLockedExpire && !accountIsLocked) {
      // Unlock the account.
      await user.unlockAccount();

      // Set the account as unlocked.
      req.accountIsUnlocked = true;
    }

    next();
  }
);

/**
 * Locks an account.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>}
 */
export const lockAccount = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, passwordIsCorrect } = req;

    if (!passwordIsCorrect && user.loginFailures >= 5) {
      await user.lockAccount();
    }
    next();
  }
);

/**
 * Generate an error if the account is locked.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>}
 */
export const generateErrorIfAccountLocked = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { accountIsLocked } = req;

    if (accountIsLocked) {
      return next(
        new AppError(401, warningMessage.WARNING_ACCOUNT_BLOCKED, {
          request: errorMessage.ERROR_ACCOUNT_LOCKED,
        })
      );
    }

    next();
  }
);

/**
 * Generate an error if wrong password.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>}
 */
export const generateErrorWrongPassword = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { passwordIsCorrect } = req;
    if (!passwordIsCorrect) {
      return next(
        new AppError(401, warningMessage.WARNING_INVALID_FIELD, {
          password: errorMessage.ERROR_WRONG_LOGIN,
        })
      );
    }

    next();
  }
);

/**
 * Creates a new notification for the given user.
 *
 * @param {ObjectId} userId - The ID of the user to create the notification for.
 * @param {string} type - The type of the notification, e.g., "success", "error", etc.
 * @param {string} message - The message to display in the notification.
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, accountIsUnlocked } = req;

    if (accountIsUnlocked) {
      const notification = await Notification.createNotification(
        user._id,
        "success",
        notificationMessage.NOTIFICATION_UNLOCK_USER_ACCOUNT
      );

      req.notification = req.notification || [];

      if (notification) {
        req.notification.push(notification);
      }
    }

    next();
  }
);


