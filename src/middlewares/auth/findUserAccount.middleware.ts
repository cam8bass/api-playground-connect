import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import { UserInterface } from "../../shared/interfaces";
import User from "../../models/user.model";

interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
}

/**
 * Find current user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const findUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;
    const email = currentUser ? currentUser.email : req.body.email;

    const user = currentUser ? currentUser : await User.findOne({ email });

    if (user) {
      req.currentUser = user;
    }

    next();
  }
);
