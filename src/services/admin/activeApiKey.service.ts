import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import { Types } from "mongoose";
import ApiKey from "../../models/apiKey.model";
import {
  UserInterface,
  NotificationInterface,
  ApiKeyInterface,
} from "../../shared/interfaces";
import {
  warningMessage,
  errorMessage,
  subjectEmail,
  bodyEmail,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import AppError from "../../shared/utils/AppError.utils";
import EmailManager from "../../shared/utils/EmailManager.utils";
import ApiKeyManager from "../../shared/utils/createApiKey.utils";
import { formatNotification } from "../../shared/utils/formatNotification";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import Notification from "../../models/notification.model";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  active?: boolean;
  newApiKeyHash?: string;
  apiKey?: ApiKeyInterface;
  newApiKey?: string;
  sendEmail?: boolean;
  notification?: NotificationInterface;
}

/**
 * Validate the active field in the request body.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const validateField = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const active = req.body.active as boolean;

    if (
      active === undefined ||
      active === null ||
      typeof active !== "boolean"
    ) {
      return next(
        new AppError(500, warningMessage.WARNING__REQUIRE_FIELD, {
          active: errorMessage.ERROR_EMPTY_FIELD("active"),
        })
      );
    }
    req.active = active;
    next();
  }
);

/**
 * Create a new API key.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const createNewApiKey = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { active } = req;

    if (active === true) {
      const newApiKey = ApiKeyManager.createNewApiKey();

      req.newApiKey = newApiKey;
    }
    next();
  }
);

/**
 * Create an API key hash.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const createApiKeyHash = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { active, newApiKey } = req;

    if (active === true) {
      const newApiKeyHash = await ApiKeyManager.encryptApiKey(newApiKey);

      req.newApiKeyHash = newApiKeyHash;
    }
    next();
  }
);

/**
 * Find the user and update the active field if the active field is true.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const findUserAndUpdateIfActive = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { active, newApiKeyHash } = req;
    const idUser = new Types.ObjectId(req.params.id);
    const idApi = new Types.ObjectId(req.params.idApi);

    if (active === true) {
      const apiKey = await ApiKey.findOneAndUpdate(
        {
          user: idUser,
          apiKeys: {
            $elemMatch: {
              _id: idApi,
              active: false,
            },
          },
        },
        {
          $set: {
            "apiKeys.$.active": true,
            "apiKeys.$.apiKey": newApiKeyHash,
            "apiKeys.$.apiKeyExpire": new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ),
          },
        },
        { new: true }
      );

      if (!apiKey) {
        return next(
          new AppError(
            404,
            warningMessage.WARNING_DOCUMENT_NOT_FOUND("clé d'api"),
            {
              request: errorMessage.ERROR_NO_SEARCH_RESULTS,
            }
          )
        );
      }

      req.apiKey = apiKey;
    }
    next();
  }
);

/**
 * Send an email if the active field is true.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const sendEmailIfActive = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { active, apiKey, newApiKey } = req;

    if (active === true) {
      const sendEmail = await EmailManager.send({
        to: apiKey.user.email,
        subject: subjectEmail.SUBJECT_API_KEY("Création"),
        text: bodyEmail.SEND_API_KEY(newApiKey),
      });
      req.sendEmail = sendEmail;
    }

    next();
  }
);

/**
 * Create a user notification if the active field is true.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const createUserNotificationIfActive = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { active, sendEmail, apiKey, user: currentUser } = req;

    if (active === true) {
      let notification: NotificationInterface;

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
          notificationMessage.NOTIFICATION_ACTIVE_API_KEY(apiKey.user.email)
        );
      }
      req.notification = notification;
    }
    next();
  }
);

/**
 * Generate a response if the active field is true.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const generateResponseIfActive = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { active, notification, apiKey } = req;
    if (active === true) {
      return res.status(200).json(
        jsonResponse({
          data: apiKey,
          notification: formatNotification(notification),
        })
      );
    }
    next();
  }
);

/**
 * Find the user and update the active field if the active field is false.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const findAndUpdateUserIfInactive = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { active } = req;
    const idUser = new Types.ObjectId(req.params.id);
    const idApi = new Types.ObjectId(req.params.idApi);

    if (active === false) {
      const apiKey = await ApiKey.findOneAndUpdate(
        {
          user: idUser,
          apiKeys: {
            $elemMatch: {
              _id: idApi,
              active: false,
            },
          },
        },
        {
          $pull: {
            apiKeys: { _id: idApi },
          },
        },
        { new: true }
      );

      if (!apiKey) {
        return next(
          new AppError(
            404,
            warningMessage.WARNING_DOCUMENT_NOT_FOUND("clé d'api"),
            {
              request: errorMessage.ERROR_NO_SEARCH_RESULTS,
            }
          )
        );
      }

      req.apiKey = apiKey;
    }
    next();
  }
);

/**
 * Find and delete the API key if the active field is false and there are no more API keys.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const findAndDeleteIfInactive = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { active, apiKey } = req;

    if (active === false) {
      if (apiKey.apiKeys.length < 1) {
        await ApiKey.findByIdAndDelete(new Types.ObjectId(apiKey._id));
      }
    }
    next();
  }
);

/**
 * Send an email if the active field is false.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const sendEmailIfInactive = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { active, apiKey } = req;

    if (active === false) {
      const sendEmail = await EmailManager.send({
        to: apiKey.user.email,
        subject: subjectEmail.SUBJECT_ADMIN_REFUSAL_API_KEY_CREATION,
        text: bodyEmail.REFUSAL_API_KEY_CREATION,
      });

      req.sendEmail = sendEmail;
    }
    next();
  }
);

/**
 * Create user notification if the active field is false.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {void}
 */
export const createUserNotificationIfInactive = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { active, sendEmail, apiKey, user: currentUser } = req;
    let notification: NotificationInterface;

    if (active === false) {
      if (!sendEmail) {
        notification = await Notification.createNotification(
          currentUser._id,
          "fail",
          notificationMessage.NOTIFICATION_ADMIN_SENT_REFUSAL_API_KEY_CREATION(
            apiKey.user._id,
            apiKey.user.email
          )
        );
      } else {
        notification = await Notification.createNotification(
          currentUser._id,
          "success",
          notificationMessage.NOTIFICATION_ADMIN_REFUSAL_API_KEY
        );
      }

      req.notification = notification;
    }
    next();
  }
);

/**
 * Generate response if the active field is false.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {void}
 */
export const generateReponseIfInactive = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { active, apiKey, notification } = req;

    if (active === false) {
      return res.status(200).json(
        jsonResponse({
          data: apiKey,
          notification: formatNotification(notification),
        })
      );
    }
  }
);

/**
 * Active api key middleware
 */
export const activeApiKey = [
  validateField,
  createNewApiKey,
  createApiKeyHash,
  findUserAndUpdateIfActive,
  sendEmailIfActive,
  createUserNotificationIfActive,
  generateResponseIfActive,
  findAndUpdateUserIfInactive,
  findAndDeleteIfInactive,
  sendEmailIfInactive,
  createUserNotificationIfInactive,
  generateReponseIfInactive,
];
