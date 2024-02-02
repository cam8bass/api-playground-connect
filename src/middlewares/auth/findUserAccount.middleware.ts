import { NextFunction, Request, Response } from "express";
import { User } from "../../models";
import { UserInterface } from "../../shared/interfaces";
import { catchAsync } from "../../shared/utils";

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
