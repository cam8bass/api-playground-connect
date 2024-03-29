import { NextFunction, Request, Response } from "express";
import { nodeEnv } from "../shared/types/types";
import {
  handleCastError,
  handleDuplicateError,
  handleErrorDev,
  handleErrorProd,
  handleJsonWebTokenError,
  handleTokenExpiredError,
  handleValidationError,
} from "../models/error.model";

export default async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const nodeEnv = process.env.NODE_ENV as nodeEnv;
  err.status = err.status || "error";
  err.statusCode = err.statusCode || 500;

  if (nodeEnv === "development") {
    handleErrorDev(err, res);
  } else if (nodeEnv === "production") {
    let error = err;
    // CAST ERROR
    if (error.name === "CastError") error = handleCastError(error);
    // VALIDATION ERROR
    if (error.name === "ValidationError") error = handleValidationError(error);
    // DUPLICATE ERROR
    if (error.code === 11000) error = handleDuplicateError(error);
    // JWT SIGNATURE ERROR
    if (error.name === "JsonWebTokenError") error = handleJsonWebTokenError();
    // JWT EXPIRE ERROR
    if (error.name === "TokenExpiredError") error = handleTokenExpiredError();

    handleErrorProd(error, res);
  }
};
