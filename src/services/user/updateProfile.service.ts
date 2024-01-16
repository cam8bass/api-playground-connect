import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";
import { Types } from "mongoose";
import User from "../../models/user.model";
import { UserInterface, NotificationInterface } from "../../shared/interfaces";
import { warningMessage, errorMessage } from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import AppError from "../../shared/utils/AppError.utils";
import bodyFilter from "../../shared/utils/filterBodyRequest.utils";
import { formatNotification } from "../../shared/utils/formatNotification";
import { formatUserResponse } from "../../shared/utils/formatResponse.utils";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";

interface CustomRequestInterface extends Request {
  filteredBody?: Partial<UserInterface>;
  currentUser?: UserInterface;
  modifiedFields?: any[];
  notification?: NotificationInterface;
  user?: UserInterface;
}

/**
 * Check if the password field is present in the request body. If it is, throw an error.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const checkPasswordPresence = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { password } = req.body;

    if (password) {
      return next(
        new AppError(400, warningMessage.WARNING_MANIPULATE_FIELD, {
          request: errorMessage.ERROR_WRONG_PASSWORD_ROUTE,
        })
      );
    }

    next();
  }
);

/**
 * Filter the request body to only include the firstname and lastname fields.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const filteredRequestBody = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const filteredBody = bodyFilter<UserInterface>(
      req.body,
      "firstname",
      "lastname"
    );

    if (Object.entries(filteredBody).length === 0) {
      return next(
        new AppError(400, warningMessage.WARNING_EMPTY_MODIFICATION, {
          request: errorMessage.ERROR_EMPTY_USER_MODIFICATION,
        })
      );
    }

    req.filteredBody = filteredBody;
    next();
  }
);

/**
 * Find and update the user's profile.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const findAndUpdateUserProfile = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user: currentUser, filteredBody } = req;

    const user = await User.findByIdAndUpdate(
      new Types.ObjectId(currentUser._id),
      filteredBody,
      {
        runValidators: true,
        new: true,
      }
    );

    if (!user) {
      return next(
        new AppError(
          401,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_LOGIN_REQUIRED,
          }
        )
      );
    }

    req.currentUser = user;
    next();
  }
);

/**
 * Create and send a new access token to the user.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const createAndSendToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    await currentUser.createAndSendToken(
      res,
      new Types.ObjectId(currentUser._id),
      currentUser.role
    );

    next();
  }
);

/**
 * Get the list of modified fields in the user's profile.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const takeModifiedFields = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { filteredBody } = req;
    const keyMapping = {
      firstname: "Nom",
      lastname: "Prénom",
    };

    const modifiedFields = Object.keys(filteredBody).map(
      (key) => keyMapping[key] || key
    );

    req.modifiedFields = modifiedFields;

    next();
  }
);

/**
 * Create a new notification for the user.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, modifiedFields } = req;

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
 * Generate the response for updating the user's profile.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, notification } = req;

    res.status(200).json(
      jsonResponse({
        notification: formatNotification(notification),
        data: formatUserResponse(currentUser, "user"),
      })
    );
  }
);

// /**
//  * The update user profile middleware.
//  */
// export const updateUserProfile = [
//   checkPasswordPresence,
//   filteredRequestBody,
//   findAndUpdateUserProfile,
//   createAndSendToken,
//   takeModifiedFields,
//   createUserNotification,
//   generateResponse,
// ];
