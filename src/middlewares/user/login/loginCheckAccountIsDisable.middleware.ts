import { NextFunction } from "express";
import { User,Notification } from "../../../models";
import { UserInterface, NotificationDetailInterface } from "../../../shared/interfaces";
import { subjectEmail, bodyEmail, errorMessage } from "../../../shared/messages";
import { notificationMessage } from "../../../shared/messages/notification.message";
import { catchAsync, EmailManager } from "../../../shared/utils";


interface CustomRequestInterface extends Request {
  user?: UserInterface;
  sendEmail?: boolean;
  notification?: NotificationDetailInterface[];
}

/**
 * Check if account is disable
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const checkIfAccountIsDisable = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;

    if (user.disableAccountAt && user.accountDisabled) {
      await User.findByIdAndUpdate(user._id, {
        accountDisabled: false,
        $unset: {
          disableAccountAt: "",
        },
      });
    }

    next();
  }
);

/**
 * Send email login
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;

    if (user.disableAccountAt && user.accountDisabled) {
      const sendEmail = await EmailManager.send({
        to: user.email,
        subject: subjectEmail.SUBJECT_ACCOUNT_REACTIVATION,
        text: bodyEmail.SEND_NOTIFICATION_ACCOUNT_REACTIVATION,
      });
      req.sendEmail = sendEmail;
    }

    next();
  }
);

/**
 * Creates an admin notification if the account is disabled and the email has not been sent.
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, sendEmail } = req;

    if (user.disableAccountAt && user.accountDisabled) {
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
 * Creates a user notification.
 * @param {ObjectId} userId - The ID of the user to create the notification for.
 * @param {string} type - The type of notification.
 * @param {string} message - The message to display in the notification.
 * @returns {Promise<Notification>} The created notification.
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, sendEmail } = req;

    if (user.disableAccountAt && user.accountDisabled) {
      let notification: NotificationDetailInterface;

      if (!sendEmail) {
        notification = await Notification.createNotification(
          user._id,
          "fail",
          errorMessage.ERROR_SEND_EMAIL_RE_ENABLE_ACCOUNT
        );
      } else {
        notification = await Notification.createNotification(
          user._id,
          "success",
          notificationMessage.NOTIFICATION_USER_REACTIVATED_ACCOUNT
        );
      }

      req.notification = req.notification || [];

      if (notification) {
        req.notification.push(notification);
      }
    }

    next();
  }
);
