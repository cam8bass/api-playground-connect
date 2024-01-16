import { NextFunction, Response, Request } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";
import User from "../../models/user.model";
import { UserInterface, NotificationInterface } from "../../shared/interfaces";
import { notificationMessage } from "../../shared/messages/notification.message";
import bodyFilter from "../../shared/utils/filterBodyRequest.utils";
import { formatNotification } from "../../shared/utils/formatNotification";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";

interface CustomRequestInterface extends Request {
  filteredBody?: Partial<UserInterface>;
  newUser?: UserInterface;
  notification?: NotificationInterface;
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
 * Create a new user account
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function in the middleware chain
 */
export const createUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { filteredBody } = req;

    const user = await User.create(filteredBody);

    req.newUser = user;
    next();
  }
);

/**
 * Create a new notification for the newly created user
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function in the middleware chain
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { newUser } = req;

    const notification = await Notification.createNotification(
      newUser._id,
      "success",
      notificationMessage.NOTIFICATION_SUCCESS_CREATE_ACCOUNT
    );

    req.notification = notification;
    next();
  }
);

/**
 * Generate the response for the sign up endpoint
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function in the middleware chain
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { notification } = req;

    res
      .status(200)
      .json(jsonResponse({ notification: formatNotification(notification) }));
  }
);

// /**
//  * The sign up middleware array
//  */
// export const signUp = [
//   filteredBody,
//   createUser,
//   createUserNotification,
//   generateResponse,
// ];
