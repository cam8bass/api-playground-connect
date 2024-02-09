import { NextFunction, Request, Response } from "express";
import { ApiKey, Notification } from "../../models";
import {
  ApiKeyInterface,
  NotificationDetailInterface,
  UserInterface,
} from "../../shared/interfaces";
import {
  ApiKeyManager,
  AppError,
  EmailManager,
  catchAsync,
  fieldErrorMessages,
  jsonResponse,
} from "../../shared/utils";
import {
  bodyEmail,
  errorMessage,
  subjectEmail,
  warningMessage,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";

interface CustomRequestInterface extends Request {
  apiKey?: ApiKeyInterface;
  newApiKey?: string;
  newApiKeyHash?: string;
  sendEmail?: boolean;
  currentUser?: UserInterface;
  notification?: NotificationDetailInterface[];
}

/**
 * Validate fields in the request body
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const validateFields = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { idUser, apiName } = req.body;

    if (!idUser || !apiName) {
      const requiredFields = {
        user: errorMessage.ERROR_EMPTY_FIELD("id de l'utilisateur"),
        apiName: errorMessage.ERROR_EMPTY_FIELD("nom de l'api"),
      };

      const errors = fieldErrorMessages({ idUser, apiName }, requiredFields);

      return next(
        new AppError(req, {
          statusCode: 400,
          message: warningMessage.WARNING__REQUIRE_FIELD,
          fields: errors,
        })
      );
    }

    next();
  }
);

/**
 * Find and check if the user already has an api key with the given name
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const findAndCheckUserApiKeys = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { idUser, apiName } = req.body;

    const userApiKeys = await ApiKey.findOne<ApiKeyInterface>({
      user: idUser,
    }).select("apiKeys.apiName");

    if (userApiKeys && !userApiKeys.checkUserApiKeys(userApiKeys, apiName)) {
      return next(
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_DUPLICATE_DOCUMENT,
          fields: {
            form: errorMessage.ERROR_DUPLICATE_API_KEY,
          },
        })
      );
    }

    next();
  }
);

/**
 * Create a new api key
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createNewApiKey = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const newApiKey = ApiKeyManager.createNewApiKey();

    req.newApiKey = newApiKey;
    next();
  }
);

/**
 * Encrypt the new api key
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const encryptNewApiKey = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { newApiKey } = req;

    const newApiKeyHash = await ApiKeyManager.encryptApiKey(newApiKey);

    req.newApiKeyHash = newApiKeyHash;

    next();
  }
);

/**
 * Add the new api key to the user's collection
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const addNewApiKeyUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { idUser, apiName } = req.body;
    const { newApiKeyHash } = req;

    const apiKey = await ApiKey.findOneAndUpdate<ApiKeyInterface>(
      {
        user: idUser,
      },
      {
        $push: {
          apiKeys: {
            apiName: apiName,
            active: true,
            apiKey: newApiKeyHash,
            apiKeyExpire: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        },
      },

      {
        upsert: true,
        runValidators: true,
        new: true,
      }
    );
    req.apiKey = apiKey;
    next();
  }
);

/**
 * Send an email to the user with the new api key
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiKey, newApiKey } = req;

    const sendEmail = await EmailManager.send({
      to: apiKey.user.email,
      subject: subjectEmail.SUBJECT_API_KEY("Création"),
      text: bodyEmail.SEND_API_KEY(newApiKey),
    });

    req.sendEmail = sendEmail;

    next();
  }
);

/**
 * Create an admin notification for the new api key
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, currentUser, apiKey } = req;
    let notification: NotificationDetailInterface;

    if (!sendEmail) {
      notification = await Notification.createNotification(
        currentUser._id,
        "fail",
        notificationMessage.NOTIFICATION_ADMIN_SENT_NEW_API_KEY(
          apiKey.user._id,
          apiKey.user.email
        )
      );
    } else {
      notification = await Notification.createNotification(
        currentUser._id,
        "success",
        notificationMessage.NOTIFICATION_SUCCESS_ADMIN_CREATE_NEW_API_KEY
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
 * Create a user notification for the new api key
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiKey } = req;

    await Notification.createNotification(
      apiKey.user._id,
      "success",
      notificationMessage.NOTIFICATION_ADMIN_CREATE_NEW_API_KEY
    );

    next();
  }
);

/**
 * Generate the response for the api key creation endpoint
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { notification, apiKey } = req;

    res.status(200).json(
      jsonResponse({
        data: apiKey,
        notification,
      })
    );
  }
);
