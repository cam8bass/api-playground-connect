import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import { Types } from "mongoose";
import ApiKey from "../../models/apiKey.model";
import {
  ApiKeyInterface,
  NotificationDetailInterface,
  UserInterface,
} from "../../shared/interfaces";
import { warningMessage, errorMessage } from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import AppError from "../../shared/utils/AppError.utils";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import Notification from "../../models/notification.model";

interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
  idUser?: Types.ObjectId | null;
  apiKey?: ApiKeyInterface;
  notification?: NotificationDetailInterface[];
}

/**
 * Defines the idUser property of the request object.
 * @function defineIdUser
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const defineIdUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    let idUser =
      currentUser.role === "user"
        ? new Types.ObjectId(currentUser._id)
        : currentUser.role === "admin"
        ? new Types.ObjectId(req.params.id)
        : null;

    req.idUser = idUser;
    next();
  }
);

/**
 * Checks the idUser property of the request object for admin users.
 * @function checkIdUserForAdmin
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const checkIdUserForAdmin = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, idUser } = req;
    if (currentUser.role === "admin") {
      if (!idUser) {
        return next(
          new AppError(400, warningMessage.WARNING__REQUIRE_FIELD, {
            request: errorMessage.ERROR_EMPTY_FIELD("utilisateur"),
          })
        );
      }
    }
    next();
  }
);

/**
 * Finds the API key and updates it in the request object.
 * @function findApiKeyAndUpdate
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const findApiKeyAndUpdate = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { idUser } = req;
    const idApi = new Types.ObjectId(req.params.idApi);

    const apiKey = await ApiKey.findOneAndUpdate(
      {
        user: idUser,
        apiKeys: {
          $elemMatch: {
            _id: idApi,
          },
        },
      },
      {
        $pull: { apiKeys: { _id: idApi } },
      },
      { new: true }
    ).select("apiKeys");

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
    next();
  }
);

/**
 * Checks if the API key is the last one for the user, and deletes it if it is.
 * @function checkAndDeleteIfLastApiKey
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const checkAndDeleteIfLastApiKey = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiKey } = req;

    if (apiKey.apiKeys.length < 1) {
      await ApiKey.findByIdAndDelete(new Types.ObjectId(apiKey._id));
    }
    next();
  }
);

/**
 * Creates a notification for the user.
 * @function createUserNotification
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, idUser } = req;

    let notification: NotificationDetailInterface;

    if (currentUser.role === "admin") {
      notification = await Notification.createNotification(
        currentUser._id,
        "success",
        notificationMessage.NOTIFICATION_ADMIN_SUCCESS_DELETE_SELECTED_APIKEY
      );
    } else {
      notification = await Notification.createNotification(
        idUser,
        "success",
        notificationMessage.NOTIFICATION_SUCCESS_DELETE_SELECTED_APIKEY
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
 * Generates the response for the request.
 * @function generateResponse
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} Nothing.
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiKey, notification } = req;
    res.status(200).json(
      jsonResponse({
        data: apiKey,
        notification,
      })
    );
  }
);

// /**
//  * Deleting a selected API key middleware
//  */
// export const deleteSelectedApiKey = [
//   defineIdUser,
//   checkIdUserForAdmin,
//   findApiKeyAndUpdate,
//   checkAndDeleteIfLastApiKey,
//   createUserNotification,
//   generateResponse,
// ];