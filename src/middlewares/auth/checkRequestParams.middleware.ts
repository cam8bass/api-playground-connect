import { NextFunction, Request, Response } from "express";
import { AppError, catchAsync } from "../../shared/utils";
import { isValidObjectId } from "mongoose";
import { errorMessage } from "../../shared/messages";

/**
 * Verifies the request parameters.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next middleware function.
 */
export const checkRequestParams = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = req.params;

    Object.entries(params).forEach(([key, value]) => {
      let isValid = true;
      let statusCode = 401;
      let message = errorMessage.ERROR_REQUEST_PARAMETERS_CORRUPTED;

      switch (key) {
        case "token":
          const regex = /^[0-9a-fA-F]{64}$/;
          isValid = regex.test(value);
          break;

        case "idUser":
        case "idApi":
        case "id":
          isValid = isValidObjectId(value);
          break;

        default:
          isValid = false;
          message = errorMessage.ERROR_INVALID_REQUEST_PARAMETERS;
          break;
      }

      if (!isValid) {
        return next(new AppError(req, { statusCode, message }));
      }
    });

    next();
  }
);
