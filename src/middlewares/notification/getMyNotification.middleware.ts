import { NextFunction, Request, Response } from "express";
import { UserInterface, NotificationInterface } from "../../shared/interfaces";
import { catchAsync, jsonResponse } from "../../shared/utils";
import { Notification } from "../../models";

interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
  notification?: NotificationInterface;
}

/**
 * Find a notification for a user
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 */

export const findNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    const notification = await Notification.findOne({
      user: currentUser._id,
    }).lean();

    req.notification = notification;

    next();
  }
);

/**
 * Generate a response with the notification data
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { notification } = req;

    res.status(200).json(jsonResponse({ data: notification }));
  }
);
