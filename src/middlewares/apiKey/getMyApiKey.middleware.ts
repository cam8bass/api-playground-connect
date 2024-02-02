import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { ApiKey } from "../../models";
import { UserInterface, ApiKeyInterface } from "../../shared/interfaces";
import { catchAsync, jsonResponse } from "../../shared/utils";


interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
  apiKeys?: ApiKeyInterface;
}

/**
 * Fetches the user's API keys from the database.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>}
 */
export const findApiKeys = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const {  currentUser } = req;
    const idUser = new Types.ObjectId(currentUser._id);

    const apiKeys = await ApiKey.findOne({ user: idUser })
      .select("-apiKeys.renewalToken -apiKeys.renewalTokenExpire")
      .lean();

    if (!apiKeys) {
      return res.status(204).end();
    }

    req.apiKeys = apiKeys;
    next();
  }
);

/**
 * Generates a response with the user's API keys.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>}
 */
export const generateReponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiKeys } = req;
    res.status(200).json(jsonResponse({ data: apiKeys }));
  }
);

// /**
//  * Get user api key middleware
//  */
// export const getMyApiKey = [findApiKeys, generateReponse];
