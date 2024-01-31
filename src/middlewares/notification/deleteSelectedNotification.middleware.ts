import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import { NotificationInterface, UserInterface } from "../../shared/interfaces";


interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
  updatedNotification?: NotificationInterface;
}

/**
 * Deletes a selected notification from a user's notification list.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function in the route.
 * @returns {Promise<void>}
 */
export const findAndDeleteSelectedNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const {  currentUser } = req; 
    const { idNotification } = req.params; 

    // delete the selected notification
    const updatedNotification = await Notification.findOneAndUpdate(
      { user: currentUser._id },
      { $pull: { notifications: { _id: idNotification } } },
      { new: true }
    );

    req.updatedNotification = updatedNotification;
    next();
  }
);

/**
 * Generates a response with the updated notification.
 *
 * @param {CustomRequestInterface} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function in the route.
 * @returns {Promise<void>}
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { updatedNotification } = req;

    // return the updated notification
    res.status(200).json(jsonResponse({ data: updatedNotification }));
  }
);


