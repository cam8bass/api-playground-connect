import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";
import { NotificationInterface, UserInterface } from "../../shared/interfaces";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  updatedNotification?: NotificationInterface;
}

/**
 * Find and update read status of a notification
 * @param {CustomRequestInterface} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export const findAndUpdateNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { idNotification } = req.params;
    const { user: currentUser } = req;
    const updatedNotification = await Notification.findOneAndUpdate(
      {
        user: new Types.ObjectId(currentUser._id),
        notifications: {
          $elemMatch: {
            _id: idNotification,
          },
        },
      },
      {
        $set: {
          "notifications.$.read": true,
          "notifications.$.readAt": new Date(Date.now()),
        },
      },
      { new: true }
    );

    req.updatedNotification = updatedNotification;
    next();
  }
);

/**
 * Generate a response with the updated notification data
 * @param {CustomRequestInterface} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { updatedNotification } = req;

    res.status(200).json(jsonResponse({ data: updatedNotification }));
  }
);

// /**
//  * Update read status of a notification middleware
//  */
// export const updateNotification = [findAndUpdateNotification, generateResponse];
