import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import ApiKey from "../../models/apiKey.model";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import { ApiKeyInterface } from "../../shared/interfaces";

interface CustomRequestInterface extends Request {
  apiKeys?: ApiKeyInterface;
}

/**
 * Fetches the ApiKeys associated with a given user
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 */
export const findUserApiKeys = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { idUser } = req.params;
    const apiKeys = await ApiKey.findOne({ user: idUser });

    if (!apiKeys) {
      return res.status(204).end();
    }
    req.apiKeys = apiKeys;
    next();
  }
);

/**
 * Generates a response with the ApiKeys
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiKeys } = req;
    res.status(200).json(jsonResponse({ data: apiKeys }));
  }
);

// /**
//  * An array of middleware functions that are used to fetch the ApiKeys and generate a response
//  */
// export const getSelectedUserApiKeys = [findUserApiKeys, generateResponse];
