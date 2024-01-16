import { NextFunction, Request, Response } from "express";
import User from "../../models/user.model";
import catchAsync from "../../shared/utils/catchAsync.utils";

import { warningMessage, errorMessage } from "../../shared/messages";
import AppError from "../../shared/utils/AppError.utils";
import { UserInterface } from "../../shared/interfaces";


interface CustomRequestInterface extends Request {
  user?: UserInterface;
  currentUser?: UserInterface;
  accountIsLocked?: boolean;
}

// /**
//  * Find current user
//  * @param {Request} req - Express request object
//  * @param {Response} res - Express response object
//  * @param {NextFunction} next - Express next middleware function
//  * @returns {Promise<void>}
//  */
export const findUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user:currentUser } = req;
    const email = currentUser ? currentUser.email : req.body.email;

    const user = currentUser
      ? currentUser
      : await User.findOne({ email }, "accountLockedExpire accountLocked");

    if (user) {
      req.currentUser = currentUser;
    }
    next();
  }
);

/**
 * Check if account is locked
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const checkIfAccountIsLocked = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    if (currentUser) {
      if (currentUser.accountLocked && currentUser.accountLockedExpire) {
        const accountIsLocked =
          Date.parse(currentUser.accountLockedExpire.toString()) > Date.now();

        if (accountIsLocked) {
          return next(
            new AppError(401, warningMessage.WARNING_ACCOUNT_BLOCKED, {
              request: errorMessage.ERROR_ACCOUNT_LOCKED,
            })
          );
        }
        req.accountIsLocked = accountIsLocked;
      }
    }
    next();
  }
);

/**
 * Delete locked expire
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const deleteLockedExpire = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, accountIsLocked } = req;
    if (currentUser) {
      if (!accountIsLocked) {
        await currentUser.deleteAccountLockedExpire();
      }
    }

    next();
  }
);

// interface CustomRequestInterface extends Request {
//   user?: UserInterface;
//   currentUser?: UserInterface;
// }

// /**
//  * Find current user
//  * @param {Request} req - Express request object
//  * @param {Response} res - Express response object
//  * @param {NextFunction} next - Express next middleware function
//  * @returns {Promise<void>}
//  */
// export const findUser = catchAsync(
//   async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
//     const { user } = req;
//     const email = req.user ? user.email : req.body.email;

//     const currentUser = user
//       ? user
//       : await User.findOne({ email }, "accountLockedExpire accountLocked");

//     if (
//       !currentUser ||
//       (!currentUser.accountLockedExpire && !currentUser.accountLocked)
//     )
//       return next();

//     req.currentUser = currentUser;
//     next();
//   }
// );

// /**
//  * Check if account is locked
//  * @param {Request} req - Express request object
//  * @param {Response} res - Express response object
//  * @param {NextFunction} next - Express next middleware function
//  * @returns {Promise<void>}
//  */
// export const checkIfAccountIsLocked = catchAsync(
//   async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
//     const { currentUser } = req;

//     const accountIsLocked =
//       Date.parse(currentUser.accountLockedExpire.toString()) > Date.now();

//     if (accountIsLocked) {
//       return next(
//         new AppError(401, warningMessage.WARNING_ACCOUNT_BLOCKED, {
//           request: errorMessage.ERROR_ACCOUNT_LOCKED,
//         })
//       );
//     }

//     next();
//   }
// );

// /**
//  * Delete locked expire
//  * @param {Request} req - Express request object
//  * @param {Response} res - Express response object
//  * @param {NextFunction} next - Express next middleware function
//  * @returns {Promise<void>}
//  */
// export const deleteLockedExpire = catchAsync(
//   async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
//     const { currentUser } = req;

//     await currentUser.deleteAccountLockedExpire();

//     next();
//   }
// );

// // /**
// //  * Account is locked middleware
// //  */
// // export const accountIsLocked = [
// //   findUser,
// //   checkIfAccountIsLocked,
// //   deleteLockedExpire,
// // ];
