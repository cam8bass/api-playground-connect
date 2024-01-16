import { NextFunction, Response, Request } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";
import User from "../../models/user.model";
import { UserInterface, NotificationInterface } from "../../shared/interfaces";
import {
  warningMessage,
  validationMessage,
  errorMessage,
  subjectEmail,
  bodyEmail,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import AppError from "../../shared/utils/AppError.utils";
import EmailManager from "../../shared/utils/EmailManager.utils";
import { formatNotification } from "../../shared/utils/formatNotification";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import { createResetRandomToken } from "../../shared/utils/reset.utils";

interface CustomRequestInterface extends Request {
  randomToken?: {
    resetToken: string;
    resetHashToken: string;
    dateExpire: Date;
  };
  currentUser?: UserInterface;
  resetUrl?: string;
  sendEmail?: boolean;
  notification?: NotificationInterface;
}

/**
 * Validate email field
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next function
 * @returns {void}
 */
export const validateField = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return next(
        new AppError(400, warningMessage.WARNING__REQUIRE_FIELD, {
          email: validationMessage.VALIDATE_REQUIRED_FIELD("adresse email"),
        })
      );
    }

    next();
  }
);
/**
 * Generate reset token
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next function
 * @returns {void}
 */
export const generateResetRandomToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { resetToken, resetHashToken, dateExpire } = createResetRandomToken();
    req.randomToken = { resetToken, resetHashToken, dateExpire };
    next();
  }
);

/**
 * Update user
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next function
 * @returns {void}
 */
export const findAndUpdateUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const { randomToken } = req;
    const user = await User.findOneAndUpdate(
      {
        email,
      },
      {
        passwordResetToken: randomToken.resetHashToken,
        passwordResetTokenExpire: randomToken.dateExpire,
      }
    ).select("email");

    if (!user) {
      return next(
        new AppError(
          400,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_WRONG_EMAIL,
          }
        )
      );
    }
    req.currentUser = user;

    next();
  }
);

/**
 * Generate reset url
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next function
 * @returns {void}
 */
export const createResetUrl = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, randomToken } = req;

    req.resetUrl = currentUser.createResetUrl(
      req,
      randomToken.resetToken,
      "password"
    );

    next();
  }
);

/**
 * Send reset email
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next function
 * @returns {void}
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const { resetUrl } = req;

    const sendEmail = await EmailManager.send({
      to: email,
      subject: subjectEmail.SUBJECT__RESET_FIELD("mot de passe"),
      text: bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    req.sendEmail = sendEmail;

    next();
  }
);

/**
 * Delete reset token
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next function
 * @returns {void}
 */
export const deleteResetToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, sendEmail } = req;

    if (!sendEmail) {
      await currentUser.deletePasswordResetToken();
    }
    next();
  }
);

/**
 * Create admin notification
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next function
 * @returns {void}
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Mot de passe oublié",
          currentUser._id,
          currentUser.email
        )
      );
    }

    next();
  }
);

/**
 * Generate error for email not sent
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next function
 * @returns {void}
 */
export const generateErrorSendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail } = req;
    if (!sendEmail) {
      return next(
        new AppError(500, warningMessage.WARNING__EMAIL, {
          request: errorMessage.ERROR_SENT_EMAIL_RESET_PASSWORD,
        })
      );
    }

    next();
  }
);

/**
 * Create user notification
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next function
 * @returns {void}
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;
    const notification = await Notification.createNotification(
      currentUser._id,
      "success",
      notificationMessage.NOTIFICATION_SENT_EMAIL_RESET_PASSWORD(
        currentUser.email
      )
    );

    req.notification = notification;
    next();
  }
);

/**
 * Generate forgot password response
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next function
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
//  * Forgot password middleware
//  */
// export const forgotPassword = [
//   validateField,
//   generateResetRandomToken,
//   findAndUpdateUser,
//   createResetUrl,
//   sendEmail,
//   deleteResetToken,
//   createAdminNotification,
//   generateErrorSendEmail,
//   createUserNotification,
//   generateResponse,
// ];
