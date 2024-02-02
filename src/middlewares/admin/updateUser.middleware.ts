import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { User,Notification } from "../../models";
import { UserInterface, NotificationDetailInterface } from "../../shared/interfaces";
import { warningMessage, errorMessage } from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import { catchAsync, bodyFilter, AppError, jsonResponse, formatUserResponse } from "../../shared/utils";


interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
  selectedUser?: UserInterface;
  filteredBody?: Partial<UserInterface>;
  modifiedFields?: any[];
  notification?: NotificationDetailInterface[];
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
    const { currentUser, modifiedFields } = req;
    const notification = await Notification.createNotification(
      currentUser._id,
      "success",
      notificationMessage.NOTIFICATION_FIELDS_MODIFIED(modifiedFields)
    );

    req.notification = req.notification || [];

    if (notification) {
      req.notification.push(notification);
    }

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
    const { notification, selectedUser } = req;
    res.status(200).json(
      jsonResponse({
        data: formatUserResponse(selectedUser, "admin"),
        notification,
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
