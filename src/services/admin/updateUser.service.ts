import { NextFunction, Request, Response } from "express";
import User from "../../models/user.model";
import catchAsync from "../../shared/utils/catchAsync.utils";
import { Types } from "mongoose";
import { NotificationInterface, UserInterface } from "../../shared/interfaces";
import { warningMessage, errorMessage } from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import AppError from "../../shared/utils/AppError.utils";
import bodyFilter from "../../shared/utils/filterBodyRequest.utils";
import { formatNotification } from "../../shared/utils/formatNotification";
import { formatUserResponse } from "../../shared/utils/formatResponse.utils";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import Notification from "../../models/notification.model";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  selectedUser?: UserInterface;
  filteredBody?: Partial<UserInterface>;
  modifiedFields?: any[];
  notification?: NotificationInterface;
}
/**
 * Filter request body
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const filteredRequestBody = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const filteredBody = bodyFilter<UserInterface>(
      req.body,
      "firstname",
      "lastname",
      "email",
      "active",
      "role"
    );

    req.filteredBody = filteredBody;
    next();
  }
);

/**
 * Take modified fields
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const takeModifiedFields = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { filteredBody } = req;

    const keyMapping = {
      firstname: "Nom",
      lastname: "Prénom",
      email: "email",
      active: "active",
      role: "rôle",
    };

    const modifiedFields = Object.keys(filteredBody).map(
      (key) => keyMapping[key] || key
    );

    if (Object.entries(filteredBody).length === 0) {
      return next(
        new AppError(400, warningMessage.WARNING_EMPTY_MODIFICATION, {
          request: errorMessage.ERROR_EMPTY_USER_MODIFICATION,
        })
      );
    }

    req.modifiedFields = modifiedFields;
    next();
  }
);

/**
 * Find and update user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const findAndUpdateUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const id = new Types.ObjectId(req.params.id);
    const { filteredBody } = req;

    const selectedUser = await User.findByIdAndUpdate(id, filteredBody, {
      runValidators: true,
      new: true,
    });

    if (!selectedUser) {
      return next(
        new AppError(
          404,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_NO_SEARCH_RESULTS,
          }
        )
      );
    }

    req.selectedUser = selectedUser;
    next();
  }
);

/**
 * Create user notification
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user: currentUser, modifiedFields } = req;
    const notification = await Notification.createNotification(
      currentUser._id,
      "success",
      notificationMessage.NOTIFICATION_FIELDS_MODIFIED(modifiedFields)
    );

    req.notification = notification;
    next();
  }
);

/**
 * Generate response
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user: currentUser, notification,selectedUser } = req;
    res.status(200).json(
      jsonResponse({
        data: formatUserResponse(selectedUser, "admin"),
        notification: formatNotification(notification),
      })
    );
  }
);

// /**
//  * Update user middleware
//  */
// export const updateUser = [
//   filteredRequestBody,
//   takeModifiedFields,
//   findAndUpdateUser,
//   createUserNotification,
//   generateResponse,
// ];
