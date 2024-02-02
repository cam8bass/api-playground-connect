import { NextFunction, Response, Request } from "express";
import { Types } from "mongoose";
import { UserInterface, NotificationDetailInterface } from "../../../shared/interfaces";
import { catchAsync, jsonResponse, formatUserResponse } from "../../../shared/utils";


interface CustomRequestInterface extends Request {
  user?: UserInterface;
  notification?: NotificationDetailInterface[];
}

/**
 * Create and send token
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const createAndSendToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;

    if (user.active) {
      await user.createAndSendToken(
        res,
        new Types.ObjectId(user._id),
        user.role
      );
    }
    next();
  }
);

/**
 * Generate response login
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, notification } = req;

    if (user.active) {
      return res.status(200).json(
        jsonResponse({
          data: formatUserResponse(user, "user"),
          notification: notification ?? null,
        })
      );
    }
  }
);
