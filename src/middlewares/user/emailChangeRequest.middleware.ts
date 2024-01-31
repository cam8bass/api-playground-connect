import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";
import { Types } from "mongoose";
import User from "../../models/user.model";
import {
  UserInterface,
  NotificationDetailInterface,
} from "../../shared/interfaces";
import {
  warningMessage,
  errorMessage,
  subjectEmail,
  bodyEmail,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import AppError from "../../shared/utils/AppError.utils";
import EmailManager from "../../shared/utils/EmailManager.utils";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import { createResetRandomToken } from "../../shared/utils/reset.utils";

interface CustomRequestInterface extends Request {
  emailResetTokenData?: {
    resetToken: string;
    resetHashToken: string;
    dateExpire: Date;
  };
  currentUser?: UserInterface;
  resetUrl?: string;
  notification?: NotificationDetailInterface[];
  sendEmail?: boolean;
}

/**
 * Creates a random token for email reset
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next function
 * @returns {undefined}
 */
export const createResetToken = catchAsync(
  async (req: CustomRequestInterface, _res: Response, next: NextFunction) => {
    const { resetToken, resetHashToken, dateExpire } = createResetRandomToken();

    req.emailResetTokenData = {
      resetToken,
      resetHashToken,
      dateExpire,
    };

    next();
  }
);

/**
 * Finds the user and updates the reset token
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next function
 * @returns {undefined}
 */
export const findUserAndUpdateResetToken = catchAsync(
  async (req: CustomRequestInterface, _res: Response, next: NextFunction) => {
    const { emailResetTokenData, currentUser } = req;

    const user = await User.findByIdAndUpdate(
      new Types.ObjectId(currentUser._id),
      {
        emailResetToken: emailResetTokenData.resetHashToken,
        emailResetTokenExpire: emailResetTokenData.dateExpire,
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

    next();
  }
);

/**
 * Creates the reset URL
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next function
 * @returns {undefined}
 */
export const createResetUrl = catchAsync(
  async (req: CustomRequestInterface, _res: Response, next: NextFunction) => {
    const { emailResetTokenData, currentUser } = req;

    const resetUrl = currentUser.createResetUrl(
      req,
      emailResetTokenData.resetToken,
      "email"
    );
    req.resetUrl = resetUrl;

    next();
  }
);

/**
 * Sends the email with the reset URL
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next function
 * @returns {undefined}
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, _res: Response, next: NextFunction) => {
    const { currentUser, resetUrl } = req;

    const sendEmail = await EmailManager.send({
      to: currentUser.email,
      subject: subjectEmail.SUBJECT__RESET_FIELD("email"),
      text: bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    req.sendEmail = sendEmail;

    next();
  }
);

/**
 * Creates an admin notification
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next function
 * @returns {undefined}
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, _res: Response, next: NextFunction) => {
    const { sendEmail, currentUser } = req;

    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Requête de changement d'adresse email",
          currentUser._id,
          currentUser.email
        )
      );

      await currentUser.deleteEmailResetToken();

      return next(
        new AppError(500, warningMessage.WARNING__EMAIL, {
          request: errorMessage.ERROR_SENT_EMAIL_RESET_EMAIL,
        })
      );
    }

    next();
  }
);

/**
 * Deletes the reset token
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next function
 * @returns {undefined}
 */
export const deleteResetToken = catchAsync(
  async (req: CustomRequestInterface, _res: Response, next: NextFunction) => {
    const { sendEmail, currentUser } = req;

    if (!sendEmail) {
      await currentUser.deleteEmailResetToken();
    }

    next();
  }
);

/**
 * Generates an error for when the email could not be sent
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next function
 * @returns {undefined}
 */
export const generateErrorSendEmail = catchAsync(
  async (req: CustomRequestInterface, _res: Response, next: NextFunction) => {
    const { sendEmail } = req;

    if (!sendEmail) {
      return next(
        new AppError(500, warningMessage.WARNING__EMAIL, {
          request: errorMessage.ERROR_SENT_EMAIL_RESET_EMAIL,
        })
      );
    }

    next();
  }
);

/**
 * Creates a user notification
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next function
 * @returns {undefined}
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, _res: Response, next: NextFunction) => {
    const { currentUser } = req;

    const notification = await Notification.createNotification(
      currentUser._id,
      "success",
      notificationMessage.NOTIFICATION_SENT_EMAIL_RESET_EMAIL(currentUser.email)
    );

    req.notification = req.notification || [];

    if (notification) {
      req.notification.push(notification);
    }

    next();
  }
);

/**
 * Generates the response
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @returns {object} The response object
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response) => {
    const { notification } = req;

    res.status(200).json(
      jsonResponse({
        notification,
      })
    );
  }
);

