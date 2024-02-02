import { NextFunction, Request, Response } from "express";
import { ApiKey } from "../../models";
import { ApiKeyInterface } from "../../shared/interfaces";
import { catchAsync, jsonResponse } from "../../shared/utils";


interface CustomRequestInterface extends Request {
  apiKeys?: ApiKeyInterface[];
}

/**
 * Find all inactive api keys
 * @param {Request} req - express request object
 * @param {Response} res - express response object
 * @param {NextFunction} next - express next middleware function
 * @returns {Promise<void>}
 */
export const findAllInactiveApiKeys = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const apiKeys = await ApiKey.find({
      "apiKeys.active": false,
    }).lean();
    req.apiKeys = apiKeys;
    next();
  }
);

/**
 * Generate response
 * @param {Request} req - express request object
 * @param {Response} res - express response object
 * @param {NextFunction} next - express next middleware function
 * @returns {Promise<void>}
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiKeys } = req;
    res.status(200).json(jsonResponse({ data: apiKeys }));
  }
);

// /**
//  * Get all inactive api keys middleware
//  */
// export const getAllInactiveApiKeys = [findAllInactiveApiKeys, generateResponse];
