import { NextFunction, Response, Request } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";
import User from "../../models/user.model";
import { UserInterface, NotificationInterface } from "../../shared/interfaces";
import {
  validationMessage,
  warningMessage,
  errorMessage,
  subjectEmail,
  bodyEmail,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import AppError from "../../shared/utils/AppError.utils";
import EmailManager from "../../shared/utils/EmailManager.utils";
import { fieldErrorMessages } from "../../shared/utils/fieldErrorMessage.utils";
import { formatNotification } from "../../shared/utils/formatNotification";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import { createHashRandomToken } from "../../shared/utils/reset.utils";

interface CustomRequestInterface extends Request {
  resetToken?: string;
  currentUser?: UserInterface;
  sendEmail?: boolean;
  notification?: NotificationInterface;
}

/**
 * Validate password and password confirmation fields
 *
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const validateFields = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm) {
      const requiredFields = {
        password: validationMessage.VALIDATE_REQUIRED_FIELD(
          "nouveau mot de passe"
        ),
        passwordConfirm: validationMessage.VALIDATE_REQUIRED_FIELD(
          "nouveau mot de passe de confirmation"
        ),
      };

      const errors = fieldErrorMessages(
        { password, passwordConfirm },
        requiredFields
      );

      return next(
        new AppError(400, warningMessage.WARNING__REQUIRE_FIELD, errors)
      );
    }

    next();
  }
);

/**
 * Generate hash random token
 *
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const generateHashRandomToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const resetToken = createHashRandomToken(req.params.token);

    req.resetToken = resetToken;
    next();
  }
);

/**
 * Find user by reset token
 *
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const findUserByResetToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { resetToken } = req;


    const user = await User.findOne({
      passwordResetToken:resetToken,
      passwordResetTokenExpire: { $gte: new Date(Date.now()) },
    }).select("role email");
    if (!user) {
      return next(
        new AppError(
          401,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_REQUEST_EXPIRED,
          }
        )
      );
    }

    req.currentUser = user;
    next();
  }
);

/**
 * Change user password
 *
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const changeUserPassword = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { password, passwordConfirm } = req.body;
    const { currentUser } = req;

    await currentUser.changeUserPassword(password, passwordConfirm);

    next();
  }
);

/**
 * Send password change email
 *
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    const sendEmail = await EmailManager.send({
      to: currentUser.email,
      subject: subjectEmail.SUBJECT__RESET_FIELD("mot de passe"),
      text: bodyEmail.PASSWORD_CHANGED,
    });

    req.sendEmail = sendEmail;
    next();
  }
);

/**
 * Create admin notification
 *
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, currentUser } = req;
    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Changement de mot de passe",
          currentUser._id,
          currentUser.email
        )
      );
    }
    next();
  }
);

/**
 * Create user notification
 *
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, currentUser } = req;
    let notification: NotificationInterface;

    if (!sendEmail) {
      notification = await Notification.createNotification(
        currentUser._id,
        "fail",
        notificationMessage.NOTIFICATION_SENT_EMAIL_PASSWORD_CHANGED
      );
    } else {
      notification = await Notification.createNotification(
        currentUser._id,
        "success",
        notificationMessage.NOTIFICATION_PASSWORD_MODIFIED
      );
    }
    req.notification = notification;
    next();
  }
);

/**
 * Generate response reset password
 *
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { notification } = req;

    res.status(200).json(
      jsonResponse({
        notification: formatNotification(notification),
      })
    );
  }
);

// /**
//  * Reset password middleware
//  */
// export const resetPassword = [
//   validateFields,
//   generateHashRandomToken,
//   findUserByResetToken,
//   changeUserPassword,
//   sendEmail,
//   createAdminNotification,
//   createUserNotification,
//   generateResponse,
// ];
