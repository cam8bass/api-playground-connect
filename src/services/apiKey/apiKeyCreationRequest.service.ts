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
import Notification from "../../models/notification.model";
import {
  ApiKeyInterface,
  NotificationInterface,
  UserInterface,
} from "../../shared/interfaces";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  newApiKey?: ApiKeyInterface;
  idNewApi?: Types.ObjectId;
  sendEmail?: boolean;
  notification?: NotificationInterface;
}

/**
 * Verifies a field in the request body.
 * @function verifyField
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const verifyField = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiName } = req.body;

    if (!apiName) {
      return next(
        new AppError(400, warningMessage.WARNING_INVALID_FIELD, {
          apiName: errorMessage.ERROR_EMPTY_FIELD("api"),
        })
      );
    }
    next();
  }
);

/**
 * Finds the user and checks their API keys.
 * @function findUserAndCheckApiKeys
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const findUserAndCheckApiKeys = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user: currentUser } = req;
    const { apiName } = req.body;

    const userApiKeys = await ApiKey.findOne({
      user: new Types.ObjectId(currentUser._id),
    }).select("apiKeys.apiName");

    if (userApiKeys && !userApiKeys.checkUserApiKeys(userApiKeys, apiName)) {
      return next(
        new AppError(400, warningMessage.WARNING_DUPLICATE_DOCUMENT, {
          request: errorMessage.ERROR_DUPLICATE_API_KEY,
        })
      );
    }

    next();
  }
);

/**
 * Finds and updates the new API key.
 * @function findAndUpdateNewApiKey
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const findAndUpdateNewApiKey = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiName } = req.body;
    const { user: currentUser } = req;
    const newApiKey = await ApiKey.findOneAndUpdate(
      {
        user: new Types.ObjectId(currentUser._id),
        "apiKeys.apiName": { $ne: apiName },
      },
      {
        $push: {
          apiKeys: {
            apiName: apiName,
          },
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    req.newApiKey = newApiKey;

    next();
  }
);

/**
 * Searches for the ID of the new API key.
 * @function searchIdNewApi
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const searchIdNewApi = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiName } = req.body;
    const { newApiKey } = req;

    const idNewApi = newApiKey.apiKeys.find((el) => el.apiName === apiName)._id;

    req.idNewApi = idNewApi;
    next();
  }
);

/**
 * Sends an email.
 * @function sendEmail
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiName } = req.body;
    const { idNewApi, user: currentUser } = req;

    const sendEmail = await EmailManager.send({
      to: "lc.laignel@gmail.com",
      subject: subjectEmail.SUBJECT_ADMIN_VALID_NEW_API_KEY,
      text: bodyEmail.SEND_ADMIN_CREATION_REQUEST_API_KEY_NOTIFICATION(
        apiName,
        idNewApi,
        new Types.ObjectId(currentUser._id)
      ),
    });

    req.sendEmail = sendEmail;
    next();
  }
);

/**
 * Creates an admin notification if there was an error sending an email.
 * @function createAdminNotificationIfErrorSendEmail
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const createAdminNotificationIfErrorSendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, user: currentUser } = req;

    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Demande de création de clé d'api",
          currentUser._id,
          currentUser.email
        )
      );
    }
    next();
  }
);

/**
 * Finds and deletes the API key if it was not sent by email.
 * @function findAndDeleteApiKeyIfNotSendEmail
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const findAndDeleteApiKeyIfNotSendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail } = req;
    const { apiName } = req.body;

    if (!sendEmail) {
      const deleteNewApiKey = await ApiKey.findOneAndUpdate(
        {
          user: new Types.ObjectId(req.user._id),
          apiKeys: {
            $elemMatch: {
              apiName: apiName,
            },
          },
        },
        {
          $pull: {
            apiKeys: {
              apiName: apiName,
            },
          },
        },
        { new: true }
      ).select("apiKeys");

      req.newApiKey = deleteNewApiKey;
    }
    next();
  }
);

/**
 * Deletes the document if there are no more API keys associated with the user.
 * @function findAndDeleteDocumentIfLastApiKey
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const findAndDeleteDocumentIfLastApiKey = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, newApiKey } = req;

    if (!sendEmail) {
      if (newApiKey.apiKeys.length < 1) {
        await ApiKey.findByIdAndDelete(new Types.ObjectId(newApiKey._id));
      }
    }
    next();
  }
);

/**
 * Generates an error if the email was not sent.
 * @function generateErrorIfNotSendEmail
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const generateErrorIfNotSendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail } = req;

    if (!sendEmail) {
      return next(
        new AppError(500, warningMessage.WARNING__EMAIL, {
          request: errorMessage.ERROR_SENT_EMAIL_CREATE_API_KEY,
        })
      );
    }

    next();
  }
);

/**
 * Creates an admin notification if the email was not sent.
 * @function createAdminNotification
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiName } = req.body;
    const { idNewApi, user: currentUser } = req;

    await Notification.searchAndSendAdminNotification(
      "success",
      notificationMessage.NOTIFICATION_ADMIN_APIKEY_CREATION_REQUEST({
        idUser: currentUser._id,
        email: currentUser.email,
        idApi: idNewApi,
        apiName: apiName,
      })
    );

    next();
  }
);

/**
 * Creates a user notification if the email was sent.
 * @function createUserNotification
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user: currentUser } = req;
    const notification = await Notification.createNotification(
      currentUser._id,
      "success",
      notificationMessage.NOTIFICATION_API_KEY_CREATION_REQUEST(
        currentUser.email
      )
    );

    req.notification = notification;
    next();
  }
);

/**
 * Generates the response.
 * @function generateResponse
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { newApiKey, notification } = req;

    res.status(200).json(
      jsonResponse({
        data: newApiKey,
        notification: formatNotification(notification),
      })
    );
  }
);

/**
 * user api key creation request middleware
 */
export const apiKeyCreationRequest = [
  verifyField,
  findUserAndCheckApiKeys,
  findAndUpdateNewApiKey,
  searchIdNewApi,
  sendEmail,
  createAdminNotificationIfErrorSendEmail,
  findAndDeleteApiKeyIfNotSendEmail,
  findAndDeleteDocumentIfLastApiKey,
  generateErrorIfNotSendEmail,
  createAdminNotification,
  createUserNotification,
  generateResponse,
];