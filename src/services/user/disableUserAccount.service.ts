import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";
import { Types } from "mongoose";
import User from "../../models/user.model";
import { UserInterface, NotificationInterface } from "../../shared/interfaces";
import {
  warningMessage,
  errorMessage,
  subjectEmail,
  bodyEmail,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import AppError from "../../shared/utils/AppError.utils";
import EmailManager from "../../shared/utils/EmailManager.utils";
import { formatNotification } from "../../shared/utils/formatNotification";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  disabledUser?: UserInterface;
  sendEmail?: boolean;
  notification?: NotificationInterface;
}

/**
 * Find Disable user account
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise} - Express middleware function
 */
export const findUser = catchAsync(
  async (req: CustomRequestInterface, _res: Response, next: NextFunction) => {
    const { user: currentUser } = req;

    const user = await User.findByIdAndUpdate(
      new Types.ObjectId(currentUser._id),
      {
        active: false,
        accountDisabled: true,
        disableAccountAt: new Date(),
      }
    ).select("email");

    if (!user) {
      return next(
        new AppError(
          401,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_LOGIN_REQUIRED,
          }
        )
      );
    }

    req.disabledUser = user;
    next();
  }
);

/**
 * Send email to user
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise} - Express middleware function
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, _res: Response, next: NextFunction) => {
    const { disabledUser } = req;

    const sendEmail = await EmailManager.send({
      to: disabledUser.email,
      subject: subjectEmail.SUBJECT_MODIFIED_STATUS("Désactivation"),
      text: bodyEmail.ACCOUNT_DISABLED,
    });

    req.sendEmail = sendEmail;

    next();
  }
);

/**
 * Create admin notification
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise} - Express middleware function
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { disabledUser, sendEmail } = req;

    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Désactivation de compte",
          disabledUser._id,
          disabledUser.email
        )
      );
    }
    next();
  }
);

/**
 * Create user notification
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise} - Express middleware function
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { disabledUser, sendEmail } = req;
    let notification: NotificationInterface;

    if (!sendEmail) {
      notification = await Notification.createNotification(
        disabledUser._id,
        "fail",
        notificationMessage.NOTIFICATION_EMAIL_DISABLE_ACCOUNT
      );
    } else {
      notification = await Notification.createNotification(
        disabledUser._id,
        "success",
        notificationMessage.NOTIFICATION_SENT_EMAIL_DISABLE_ACCOUNT(
          disabledUser.email
        )
      );
    }

    req.notification = notification;
    next();
  }
);

/**
 * Clear JWT token
 *
 * @param {Request} _req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void} - No return value
 */
export const clearJwtToken = catchAsync(
  async (_req: Request, res: Response, next: NextFunction) => {
    res.cookie("jwt", "", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      sameSite: "strict",
    });

    next();
  }
);

/**
 * Generate response
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise} - Express middleware function
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response) => {
    const { notification } = req;

    res.status(200).json(
      jsonResponse({
        notification: formatNotification(notification),
      })
    );
  }
);

// /**
//  * Disable user account middleware
//  *
//  */
// export const disableUserAccount = [
// findUser,
// sendEmail,
// createAdminNotification,
// createUserNotification,
// clearJwtToken,
// generateResponse,
// ];
