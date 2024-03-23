import { NextFunction, Response, Request } from "express";
import {
  UserInterface,
  NotificationDetailInterface,
} from "../../../shared/interfaces";
import {
  warningMessage,
  errorMessage,
  subjectEmail,
  bodyEmail,
} from "../../../shared/messages";
import { notificationMessage } from "../../../shared/messages/notification.message";
import {
  catchAsync,
  AppError,
  EmailManager,
  jsonResponse,
  createResetRandomToken,
} from "../../../shared/utils";
import { Notification } from "../../../models";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  sendEmail?: boolean;
  resetUrl?: string;
  randomToken?: {
    resetToken: string;
    resetHashToken: string;
    dateExpire: Date;
  };
  notification?: NotificationDetailInterface[];
}

/**
 * Check if account is inactive
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const checkIfTokenExpire = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;

    if (!user.active) {
      const activationTokenIsExpire =
        user.activationTokenExpire < new Date(Date.now());

      if (!activationTokenIsExpire) {
        return next(
          new AppError(req, {
            statusCode: 422,
            message: warningMessage.WARNING_INACTIVE_ACCOUNT,
            fields: {
              form: errorMessage.ERROR_ACTIVATION_ACCOUNT_TOKEN_NOT_EXPIRE,
            },
          })
        );
      }
    }

    next();
  }
);

/**
 * Creates a reset token if the user's activation token has expired.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>}
 */
export const createResetToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;
    if (!user.active) {
      const { resetToken, resetHashToken, dateExpire } =
        createResetRandomToken();

      req.randomToken = { resetToken, resetHashToken, dateExpire };
    }
    next();
  }
);

/**
 * Finds and updates a new token if the user's activation token has expired.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>}
 */
export const findAndUpdateNewToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user ,randomToken} = req;
    if (!user.active) {
      await user.saveActivationToken(randomToken.resetHashToken,randomToken.dateExpire);
    }

    next();
  }
);

/**
 * Creates a reset URL if the user's activation token has expired.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>}
 */
export const createResetUrl = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, randomToken } = req;
    if (!user.active) {
      const resetUrl = user.createResetUrl(req, randomToken.resetToken, "activation");

      req.resetUrl = resetUrl;
    }

    next();
  }
);

/**
 * Sends an email if the user's activation token has expired.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>}
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, resetUrl } = req;
    if (!user.active) {
      const sendEmail = await EmailManager.send({
        to: user.email,
        subject: subjectEmail.SUBJECT_MODIFIED_STATUS("Activation"),
        text: bodyEmail.SEND_RESET_URL(resetUrl, 10),
      });

      req.sendEmail = sendEmail;
    }

    next();
  }
);

/**
 * Creates an admin notification if the user's activation token has expired and the email has not been sent.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>}
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, user } = req;
    if (!user.active) {
      if (!sendEmail) {
        await Notification.searchAndSendAdminNotification(
          "error",
          errorMessage.ERROR_SEND_EMAIL(
            "Confirmation activation de compte",
            user._id,
            user.email
          )
        );
      }
    }

    next();
  }
);

/**
 * Deletes the user's activation token if the email has not been sent and the token has expired.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>}
 */
export const deleteToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, sendEmail } = req;
    if (!user.active) {
      if (!sendEmail) {
        await user.deleteActivationToken();
      }
    }

    next();
  }
);

/**
 * Generates an error if the email has not been sent and the user's activation token has expired.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>}
 */
export const generateErrorSendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, sendEmail } = req;
    if (!user.active) {
      if (!sendEmail) {
        return next(
          new AppError(req, {
            statusCode: 503,
            message: errorMessage.ERROR_SENT_EMAIL_ACTIVATION,
          })
        );
      }
    }

    next();
  }
);

/**
 * Creates a user notification if the user's activation token has expired.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>}
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;
    if (!user.active) {
      const notification = await Notification.createNotification(
        user._id,
        "success",
        notificationMessage.NOTIFICATION_SENT_NEW_EMAIL_ACTIVATION(user.email)
      );

      req.notification = req.notification || [];

      if (notification) {
        req.notification.push(notification);
      }
    }
    next();
  }
);

export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, notification } = req;
    if (!user.active) {
      res.status(200).json(jsonResponse({ notification }));
    }

    next();
  }
);
