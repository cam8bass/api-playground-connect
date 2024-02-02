import { NextFunction, Request, Response } from "express";
import { AppError, catchAsync, jsonResponse } from "../../shared/utils";
import { Notification } from "../../models";
import { warningMessage, errorMessage } from "../../shared/messages";

/**
 * @description This function is used to find and delete all user notifications
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function
 * @returns {void}
 */
export const findAndDeleteAllUserNotifications = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const notification = await Notification.findOneAndDelete({ _id: id });

    if (!notification) {
      return next(
        new AppError(
          404,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("notifications"),
          {
            request: errorMessage.ERROR_NO_SEARCH_RESULTS,
          }
        )
      );
    }
    next();
  }
);

/**
 * @description This function is used to generate a response
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function
 */
export const generateResponse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json(jsonResponse());
  }
);
