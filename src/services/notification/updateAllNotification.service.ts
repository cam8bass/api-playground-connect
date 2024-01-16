import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import { NotificationInterface, UserInterface } from "../../shared/interfaces";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  updatedNotification?: NotificationInterface;
}

/**
 * Updates all unread notifications of the user
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<void>}
 */
export const findAndUpdateAllNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user: currentUser } = req;

    // update all unread notifications of the user
    const updatedNotification = await Notification.findOneAndUpdate(
      { user: currentUser._id, "notifications.read": false },
      {
        $set: {
          "notifications.$[].read": true,
          "notifications.$[].readAt": Date.now(),
        },
      },
      { new: true }
    );

    req.updatedNotification = updatedNotification;
    next();
  }
);

/**
 * Returns the updated notification
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<void>}
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { updatedNotification } = req;
    // return the updated notification
    res.status(200).json(jsonResponse({ data: updatedNotification }));
  }
);

// /**
//  * Update all notification middleware
//  */
// export const updateAllNotification = [
//   findAndUpdateAllNotification,
//   generateResponse,
// ];
