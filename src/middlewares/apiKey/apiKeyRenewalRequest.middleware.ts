import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { ApiKey, Notification } from "../../models";
import {
  UserInterface,
  ApiKeyInterface,
  NotificationDetailInterface,
} from "../../shared/interfaces";
import {
  warningMessage,
  errorMessage,
  subjectEmail,
  bodyEmail,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import {
  catchAsync,
  AppError,
  EmailManager,
  jsonResponse,
  createResetUrl,
createResetRandomToken,
} from "../../shared/utils";

interface CustomRequestInterface extends Request {
  randomToken?: {
    resetToken: string;
    resetHashToken: string;
    dateExpire: Date;
  };
  currentUser?: UserInterface;
  apiKey?: ApiKeyInterface;
  resetUrl?: string;
  sendEmail?: boolean;
  notification?: NotificationDetailInterface[];
}

/**
 * createResetToken creates a random reset token and stores it in the request object.
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const createResetToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { resetToken, resetHashToken, dateExpire } = createResetRandomToken();

    req.randomToken = {
      resetToken,
      resetHashToken,
      dateExpire,
    };

    next();
  }
);



export const findUserApiKeys = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    const apiKey = await ApiKey.findOne({ user: currentUser._id });

    if (!apiKey) {
      return next(
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_DOCUMENT_NOT_FOUND("clé d'api"),
          fields: {
            form: errorMessage.ERROR_API_KEY_NOT_FOUND,
          },
        })
      );
    }

    req.apiKey = apiKey;

    next();
  }
);

/**
 * Checks if the email token is expired
 * @param req The request object
 * @param res The response object
 * @param next The next middleware function
 */
export const checkIfTokenExpire = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { idApi } = req.params;
    const { apiKey } = req;

    const selectedApiKey = apiKey.apiKeys.find(
      (el) => el._id === new Types.ObjectId(idApi)
    );
    if (selectedApiKey) {
      const renewalTokenIsExpire =
        selectedApiKey.renewalTokenExpire < new Date(Date.now());

      if (!renewalTokenIsExpire) {
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
 * findAndUpdateRenewalApiKey finds and updates the renewal token for an API key.
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const findApiKeyAndAddTokenExpire = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { idApi } = req.params;
    const { apiKey,randomToken  } = req;

    await apiKey.saveRenewalToken(new Types.ObjectId(idApi),randomToken.resetHashToken,randomToken.dateExpire);

    next();
  }
);



/**
 * createResetUrlWithResetToken creates a reset URL with the reset token and stores it in the request object.
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const createResetUrlWithResetToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { randomToken } = req;
    const resetUrl = createResetUrl(req, randomToken.resetToken, "apiKey");

    req.resetUrl = resetUrl;
    next();
  }
);

/**
 * sendEmail sends an email to the user with the reset URL.
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, resetUrl } = req;

    const sendEmail = await EmailManager.send({
      to: currentUser.email,
      subject: subjectEmail.SUBJECT_API_KEY("Renouvellement"),
      text: bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    req.sendEmail = sendEmail;

    next();
  }
);

/**
 * createAdminNotification creates an admin notification if the email was not sent.
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, currentUser } = req;

    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Demande de renouvellement de clé d'api",
          currentUser._id,
          currentUser.email
        )
      );
    }

    next();
  }
);

/**
 * findAndUpdateRenewalToken finds and updates the API key without the renewal token if the email was not sent.
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const deleteRenewalToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, apiKey } = req;
    const { idApi } = req.params;

    if (!sendEmail) {
      await apiKey.deleteRenewalToken(new Types.ObjectId(idApi));
    }
    next();
  }
);

/**
 * generateErrorIfNotSendEmail generates an error if the email was not sent.
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const generateErrorIfNotSendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail } = req;

    if (!sendEmail) {
      return next(
        new AppError(req, {
          statusCode: 503,
          message: errorMessage.ERROR_SENT_EMAIL_RENEWAL_API_KEY,
        })
      );
    }
    next();
  }
);

/**
 * createUserNotification creates a user notification if the email was sent.
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    const notification = await Notification.createNotification(
      currentUser._id,
      "success",
      notificationMessage.NOTIFICATION_SENT_EMAIL_RENEWAL_API_KEY(
        currentUser.email
      )
    );

    req.notification = req.notification || [];

    if (notification) {
      req.notification.push(notification);
    }

    next();
  }
);

/**
 * generateResponse generates the response with the notification.
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
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
