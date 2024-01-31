import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import User from "../../models/user.model";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";

interface CustomRequestInterface extends Request {
  data?: any;
}

/**
 * findUsersStats - This function is used to find the total number of users, active accounts, inactive accounts, disabled accounts, and locked accounts.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {void}
 */
export const findUsersStats = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const isActive = { $eq: ["$active", true] };
    const isInactive = { $eq: ["$active", false] };
    const isDisabled = { $eq: ["$accountDisabled", true] };
    const isLocked = { $eq: ["$accountLocked", true] };

    const [data] = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalActiveAccount: {
            $sum: { $cond: { if: isActive, then: 1, else: 0 } },
          },
          totalInactiveAccount: {
            $sum: { $cond: { if: isInactive, then: 1, else: 0 } },
          },
          totalDisableAccount: {
            $sum: { $cond: { if: isDisabled, then: 1, else: 0 } },
          },
          totalAccountLocked: {
            $sum: { $cond: { if: isLocked, then: 1, else: 0 } },
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    req.data = data;
    next();
  }
);

/**
 * generateReponse - This function is used to generate the response.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {void}
 */
export const generateReponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { data } = req;
    res.status(200).json(jsonResponse({ data }));
  }
);

// /**
//  * getUsersStats - This is an array of functions that are used to find the total number of users, active accounts, inactive accounts, disabled accounts, and locked accounts.
//  */
// export const getUsersStats = [findUsersStats, generateReponse];
