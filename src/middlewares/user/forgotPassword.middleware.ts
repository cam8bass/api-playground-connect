import { NextFunction, Response, Request } from "express";
import { User,Notification } from "../../models";
import { UserInterface, NotificationDetailInterface } from "../../shared/interfaces";
import { warningMessage, validationMessage, errorMessage, subjectEmail, bodyEmail } from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import { catchAsync, AppError, createResetRandomToken, EmailManager, jsonResponse } from "../../shared/utils";


interface CustomRequestInterface extends Request {
  randomToken?: {
    resetToken: string;
    resetHashToken: string;
    dateExpire: Date;
  };
  user?: UserInterface;
  resetUrl?: string;
  sendEmail?: boolean;
  notification?: NotificationDetailInterface[];
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
    req.user = user;

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
    const { user, randomToken } = req;

    req.resetUrl = user.createResetUrl(req, randomToken.resetToken, "password");

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
    const { user, sendEmail } = req;

    if (!sendEmail) {
      await user.deletePasswordResetToken();
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
    const { user } = req;

    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Mot de passe oublié",
          user._id,
          user.email
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
    const { user } = req;
    const notification = await Notification.createNotification(
      user._id,
      "success",
      notificationMessage.NOTIFICATION_SENT_EMAIL_RESET_PASSWORD(user.email)
    );

    req.notification = req.notification || [];

    if (notification) {
      req.notification.push(notification);
    }

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
        notification,
      })
    );
  }
);


