import { NextFunction, Request, Response } from "express";
import {
  AppError,
  EmailManager,
  catchAsync,
  jsonResponse,
} from "../../shared/utils";
import { User, ApiKey, Notification } from "../../models";
import {
  warningMessage,
  errorMessage,
  bodyEmail,
  subjectEmail,
} from "../../shared/messages";
import {
  NotificationDetailInterface,
  UserInterface,
} from "../../shared/interfaces";
import { notificationMessage } from "../../shared/messages/notification.message";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  sendEmail?: boolean;
  currentUser?: UserInterface;
  notification?: NotificationDetailInterface[];
}

/**
 * Find a user by ID and delete it.
 *
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function in the route
 * @returns {Promise} - A promise that resolves to the next middleware or sends an error
 */
export const findUserAndDelete = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const user = await User.findOneAndDelete({ _id: id })
      .select("email")
      .lean();

    if (!user) {
  
      return next(
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          fields: {
            form: errorMessage.ERROR_NO_SEARCH_RESULTS,
          },
        })
      );
    }

    req.user = user;
    next();
  }
);

/**
 * Find and delete all API keys associated with a user.
 *
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function in the route
 * @returns {Promise} - A promise that resolves to the next middleware or sends an error
 */
export const findAndDeleteUserApiKeys = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await ApiKey.findOneAndDelete({ user: id });

    next();
  }
);

/**
 * Find and delete all notifications associated with a user.
 *
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function in the route
 * @returns {Promise} - A promise that resolves to the next middleware or sends an error
 */
export const findAndDeleteUserNotifications = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await Notification.findOneAndDelete({ user: id });

    next();
  }
);

/**
 * Send an email to the user notifying them of their account deletion.
 *
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function in the route
 * @returns {Promise} - A promise that resolves to the next middleware or sends an error
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;
    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT_MODIFIED_STATUS("Suppression"),
      text: bodyEmail.ACCOUNT_DELETED,
    });

    req.sendEmail = sendEmail;

    next();
  }
);

/**
 * Create a notification for admin.
 *
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function in the route
 * @returns {Promise} - A promise that resolves to the next middleware or sends an error
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, currentUser } = req;
    let notification: NotificationDetailInterface;
    if (!sendEmail) {
      notification = await Notification.createNotification(
        currentUser._id,
        "fail",
        notificationMessage.NOTIFICATION_SENT_EMAIL_DELETE_ACCOUNT
      );
    } else {
      notification = await Notification.createNotification(
        currentUser._id,
        "success",
        notificationMessage.NOTIFICATION_SUCCESS_ADMIN_DELETE_USER
      );
    }
    req.notification = req.notification || [];

    if (notification) {
      req.notification.push(notification);
    }

    next();
  }
);

/**
 * Generate a response to the user indicating that their account has been deleted.
 *
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function in the route
 * @returns {Promise} - A promise that resolves to the next middleware or sends an error
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { notification } = req;
    res.status(200).json(
      jsonResponse({
        notification,
      })
    );
  }
);
