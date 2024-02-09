import { NextFunction, Request, Response } from "express";
import { ApiKey } from "../../models";
import { ApiKeyInterface } from "../../shared/interfaces";
import { catchAsync, jsonResponse } from "../../shared/utils";


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

