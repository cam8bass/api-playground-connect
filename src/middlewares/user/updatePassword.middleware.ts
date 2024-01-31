import { NextFunction, Response, Request } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";
import { Types } from "mongoose";
import User from "../../models/user.model";
import {
  UserInterface,
  NotificationDetailInterface,
} from "../../shared/interfaces";
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
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  currentUser?: UserInterface;
  sendEmail?: boolean;
  notification?: NotificationDetailInterface[];
}

/**
 * Validate fields
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const validateFields = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { password, newPassword, passwordConfirm } = req.body;

    if (!password || !newPassword || !passwordConfirm) {
      const requiredFields = {
        password: validationMessage.VALIDATE_REQUIRED_FIELD(
          "mot de passe actuel"
        ),
        newPassword: validationMessage.VALIDATE_REQUIRED_FIELD(
          "nouveau mot de passe"
        ),
        passwordConfirm: validationMessage.VALIDATE_REQUIRED_FIELD(
          "nouveau mot de passe de confirmation"
        ),
      };

      const errors = fieldErrorMessages(
        { password, newPassword, passwordConfirm },
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
 * Find user to update password
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const findUserUpdatePassword = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    const user = await User.findById(
      new Types.ObjectId(currentUser._id)
    ).select(
      "+password role email loginFailures accountLockedExpire accountLocked"
    );

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

    req.user = user;
    next();
  }
);

/**
 * Verify current password
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const verifyCurrentPassword = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { password } = req.body;
    const { user } = req;

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(400, warningMessage.WARNING_INVALID_FIELD, {
          password: errorMessage.ERROR_WRONG_PASSWORD,
        })
      );
    }

    next();
  }
);

/**
 * Change password of user
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const changePasswordUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { newPassword, passwordConfirm } = req.body;
    const { user } = req;

    await user.changeUserPassword(newPassword, passwordConfirm);

    next();
  }
);

/**
 * Create and send token to change password
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createAndSendToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;
    await user.createAndSendToken(res, new Types.ObjectId(user._id), user.role);
    next();
  }
);

/**
 * Send email to user with change password instructions
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT_FIELD_CHANGED("mot de passe"),
      text: bodyEmail.PASSWORD_CHANGED,
    });

    req.sendEmail = sendEmail;
    next();
  }
);

/**
 * Create admin notification
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, user } = req;
    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Modification du mot de passe en passant par le compte de l'utilisateur",
          user._id,
          user.email
        )
      );
    }
    next();
  }
);

/**
 * Create user notification
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, user } = req;
    let notification: NotificationDetailInterface;

    if (!sendEmail) {
      notification = await Notification.createNotification(
        user._id,
        "fail",
        notificationMessage.NOTIFICATION_SENT_EMAIL_PASSWORD_CHANGED
      );
    } else {
      notification = await Notification.createNotification(
        user._id,
        "success",
        notificationMessage.NOTIFICATION_PASSWORD_MODIFIED
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
 * Generate response for update password
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
        notification,
      })
    );
  }
);


