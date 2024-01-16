import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import { Types } from "mongoose";
import ApiKey from "../../models/apiKey.model";
import {
  warningMessage,
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
import { createResetUrl } from "../../shared/utils/reset.utils";
import {
  ApiKeyInterface,
  NotificationInterface,
  UserInterface,
} from "../../shared/interfaces";
import Notification from "../../models/notification.model";

interface CustomRequestInterface extends Request {
  randomToken?: {
    resetToken: string;
    resetHashToken: string;
    dateExpire: Date;
  };
  user?: UserInterface;
  apiKey?: ApiKeyInterface;
  resetUrl?: string;
  sendEmail?: boolean;
  notification?: NotificationInterface;
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

/**
 * findAndUpdateRenewalApiKey finds and updates the renewal token for an API key.
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const findAndUpdateRenewalApiKey = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const idApi = new Types.ObjectId(req.params.idApi);
    const { user: currentUser, randomToken } = req;

    const apiKey = await ApiKey.findOneAndUpdate(
      {
        user: new Types.ObjectId(currentUser._id),
        apiKeys: {
          $elemMatch: {
            _id: idApi,
            apiKeyExpire: { $gte: new Date() },
            active: true,
          },
        },
      },
      {
        $set: {
          "apiKeys.$.renewalToken": randomToken.resetHashToken,
          "apiKeys.$.renewalTokenExpire": randomToken.dateExpire,
        },
      }
    ).select("_id");

    if (!apiKey) {
      return next(
        new AppError(
          404,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("clé d'api"),
          {
            request: errorMessage.ERROR_API_KEY_EXPIRE,
          }
        )
      );
    }
    req.apiKey = apiKey;
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
    const { user: currentUser, resetUrl } = req;

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
    const { sendEmail } = req;

    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Demande de renouvellement de clé d'api",
          req.user._id,
          req.user.email
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
export const findAndUpdateRenewalToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail } = req;
    const idApi = new Types.ObjectId(req.params.idApi);

    if (!sendEmail) {
      await ApiKey.findOneAndUpdate(
        {
          user: new Types.ObjectId(req.user._id),

          apiKeys: {
            $elemMatch: {
              _id: idApi,
              apiKeyExpire: { $gte: new Date() },
              active: true,
            },
          },
        },
        {
          $unset: {
            "apiKeys.$.renewalTokenExpire": "",
            "apiKeys.$.renewalToken": "",
          },
        }
      );
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
        new AppError(500, warningMessage.WARNING__EMAIL, {
          request: errorMessage.ERROR_SENT_EMAIL_RENEWAL_API_KEY,
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
    const { user: currentUser } = req;

    const notification = await Notification.createNotification(
      currentUser._id,
      "success",
      notificationMessage.NOTIFICATION_SENT_EMAIL_RENEWAL_API_KEY(
        currentUser.email
      )
    );

    req.notification = notification;
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
        notification: formatNotification(notification),
      })
    );
  }
);

// /**
//  * api key renewal request middleware
//  */
// export const apiKeyRenewalRequest = [
//   createResetToken,
//   findAndUpdateRenewalApiKey,
//   createResetUrlWithResetToken,
//   sendEmail,
//   createAdminNotification,
//   findAndUpdateRenewalToken,
//   generateErrorIfNotSendEmail,
//   createUserNotification,
//   generateResponse,
// ];
