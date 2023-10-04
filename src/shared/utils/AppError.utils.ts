import { AppErrorInterface } from "../interfaces";
import { errorStatusType } from "../types/types";

export default class AppError extends Error implements AppErrorInterface {
  public status: errorStatusType;
  public statusCode: number;
  public isOperational: boolean;
  public errors: object;

  constructor(statusCode: number, message: string, errors: object) {
    super(message);
    this.statusCode = statusCode;
    this.status = this.statusCode.toString().startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}


