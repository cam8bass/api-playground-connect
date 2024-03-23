import { NextFunction, Request, Response } from "express";
import { Notification, User } from "../../models";
import {
  UserInterface,
  NotificationDetailInterface,
} from "../../shared/interfaces";
import {
  errorMessage,
  subjectEmail,
  bodyEmail,
  warningMessage,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import {
  catchAsync,
  AppError,
  EmailManager,
  jsonResponse,
  createResetRandomToken,
} from "../../shared/utils";

interface CustomRequestInterface extends Request {
  randomToken?: {
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
 * Checks if the email token is expired
 * @param req The request object
 * @param res The response object
 * @param next The next middleware function
 */
export const checkIfTokenExpire = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    if (currentUser.emailTokenExpire) {
      const emailTokenIsExpire =
        currentUser.emailTokenExpire < new Date(Date.now());

      if (!emailTokenIsExpire) {
        return next(
          new AppError(req, {
            statusCode: 422,
            message: warningMessage.WARNING_JWT_NOT_EXPIRED,
            fields: { form: warningMessage.WARNING_JWT_NOT_EXPIRED },
          })
        );
      }
    }

    next();
  }
);

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

    req.randomToken = {
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
    const { randomToken, currentUser } = req;

    const user = await User.findByIdAndUpdate(currentUser._id, {
      emailToken: randomToken.resetHashToken,
      emailTokenExpire: randomToken.dateExpire,
    }).select("email");

    if (!user) {
      return next(
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          fields: {
            form: errorMessage.ERROR_LOGIN_REQUIRED,
          },
        })
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
    const { randomToken, currentUser } = req;

    const resetUrl = currentUser.createResetUrl(
      req,
      randomToken.resetToken,
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
    }

    next();
  }
);

export const deleteEmailToken = catchAsync(
  async (req: CustomRequestInterface, _res: Response, next: NextFunction) => {
    const { sendEmail, currentUser } = req;

    if (!sendEmail) {
      await currentUser.deleteEmailToken();
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
        new AppError(req, {
          statusCode: 503,
          message: errorMessage.ERROR_SENT_EMAIL_RESET_EMAIL,
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
