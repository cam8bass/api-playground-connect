import { NextFunction, Request, Response } from "express";
import { bodyFilter, catchAsync, jsonResponse } from "../../shared/utils";
import {
  NotificationDetailInterface,
  UserInterface,
} from "../../shared/interfaces";
import { User, Notification } from "../../models";
import { notificationMessage } from "../../shared/messages/notification.message";

interface CustomRequestInterface extends Request {
  filteredBody?: Partial<UserInterface>;
  user?: UserInterface;
  currentUser?: UserInterface;
  notification?: NotificationDetailInterface[];
}



/**
 * Filter the request body for the sign up endpoint
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function in the middleware chain
 */
export const filteredBody = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const filteredBody = bodyFilter<UserInterface>(
      req.body,
      "firstname",
      "lastname",
      "email",
      "password",
      "passwordConfirm"
    );
    req.filteredBody = filteredBody;
    next();
  }
);

/**
 * Creates a new user
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createNewUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { filteredBody } = req;
    const user = await User.create(filteredBody);
    req.user = user;
    next();
  }
);

/**
 * Creates an admin notification for a new user
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    const notification = await Notification.createNotification(
      currentUser._id,
      "success",
      notificationMessage.NOTIFICATION_ADMIN_CREATE_USER
    );

    req.notification = req.notification || [];

    if (notification) {
      req.notification.push(notification);
    }

    next();
  }
);

/**
 * Creates a user notification for a new user
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;

    await Notification.createNotification(
      user._id,
      "success",
      notificationMessage.NOTIFICATION_ADMIN_CREATE_NEW_USER
    );

    next();
  }
);

/**
 * Generates the response for the create new user
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { notification } = req;
    res.status(200).json(
      jsonResponse({
        notification,
      })
    );
    next();
  }
);
