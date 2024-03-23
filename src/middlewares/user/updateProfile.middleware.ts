import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { User, Notification } from "../../models";
import {
  UserInterface,
  NotificationDetailInterface,
} from "../../shared/interfaces";
import { warningMessage, errorMessage } from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import {
  catchAsync,
  AppError,
  bodyFilter,
  jsonResponse,
  formatUserResponse,
  createJsonWebToken,
  createJwtCookie,
} from "../../shared/utils";

interface CustomRequestInterface extends Request {
  filteredBody?: Partial<UserInterface>;
  currentUser?: UserInterface;
  modifiedFields?: any[];
  notification?: NotificationDetailInterface[];
  user?: UserInterface;
  token?: string;
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
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_MANIPULATE_FIELD,
          fields: {
            form: errorMessage.ERROR_WRONG_PASSWORD_ROUTE,
          },
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
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_EMPTY_MODIFICATION,
          fields: {
            form: errorMessage.ERROR_EMPTY_USER_MODIFICATION,
          },
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
    const { currentUser, filteredBody } = req;

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
        new AppError(req, {
          statusCode: 401,
          message: errorMessage.ERROR_LOGIN_REQUIRED,
        })
      );
    }

    req.user = user;
    next();
  }
);

/**
 * Create json web token
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createJwtToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;

    const token = await createJsonWebToken(
      { idUser: user._id, role: user.role, authToken: true },
      { expiresIn: "30d" }
    );
    req.token = token;

    next();
  }
);

/**
 * Create cookie with json web token
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createCookie = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { token } = req;

    await createJwtCookie(res, token);

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
    const { user, modifiedFields } = req;

    const notification = await Notification.createNotification(
      user._id,
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
 * Generate the response for updating the user's profile.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, notification } = req;

    res.status(200).json(
      jsonResponse({
        notification: notification ?? null,
        data: formatUserResponse(user, "user"),
      })
    );
  }
);
