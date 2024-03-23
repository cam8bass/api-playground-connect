import { NextFunction, Response, Request } from "express";
import { Types } from "mongoose";
import {
  UserInterface,
  NotificationDetailInterface,
} from "../../../shared/interfaces";
import {
  catchAsync,
  jsonResponse,
  formatUserResponse,
  createJsonWebToken,
  createJwtCookie,
} from "../../../shared/utils";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  notification?: NotificationDetailInterface[];
  token?: string;
}

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
