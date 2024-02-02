import { NextFunction, Request, Response } from "express";
import { AppError, catchAsync, jsonResponse } from "../../shared/utils";
import { ApiKey, Notification } from "../../models";
import { warningMessage, errorMessage } from "../../shared/messages";
import {
  ApiKeyInterface,
  NotificationDetailInterface,
  UserInterface,
} from "../../shared/interfaces";
import { notificationMessage } from "../../shared/messages/notification.message";

interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
  notification?: NotificationDetailInterface[];
  apiKey: ApiKeyInterface;
}

/**
 * Find and delete an API key by its ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {Promise} The promise that resolves to the response data
 */
export const findAndDeleteApiKeys = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const apiKey = await ApiKey.findOneAndDelete({ _id: id })
      .select("email")
      .lean();

    if (!apiKey) {
      return next(
        new AppError(
          404,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("clés d'api"),
          {
            request: errorMessage.ERROR_NO_SEARCH_RESULTS,
          }
        )
      );
    }
    req.apiKey = apiKey;

    next();
  }
);

/**
 * Create a notification for the current user when they delete their own API keys
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {Promise} The promise that resolves to the response data
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    const notification = await Notification.createNotification(
      currentUser._id,
      "success",
      notificationMessage.NOTIFICATION_DELETE_USER_APIKEYS
    );

    req.notification = req.notification || [];

    if (notification) {
      req.notification.push(notification);
    }

    next();
  }
);

/**
 * Create a notification for the user whose API keys were deleted when an admin deletes all of their API keys
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {Promise} The promise that resolves to the response data
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiKey } = req;

    await Notification.createNotification(
      apiKey.user._id,
      "success",
      notificationMessage.NOTIFICATION_ADMIN_DELETE_ALL_USER_APIKEYS
    );

    next();
  }
);

/**
 * Generate the response data
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {Object} The response data
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { notification, apiKey } = req;
    return res.status(200).json(jsonResponse({ data: apiKey, notification }));
  }
);
