import {
  AppErrorConfigInterface,
  AppErrorContextInterface,
  AppErrorInterface,
  UserInterface,
} from "../interfaces";
import {
  errorCategoriesType,
  errorPriorityType,
  errorStatusType,
} from "../types/types";
import { v4 as uuidv4 } from "uuid";
import { Request } from "express";
import { Types } from "mongoose";

interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
}

export class AppError extends Error implements AppErrorInterface {
  public readonly isOperational = true;
  public readonly _id: string;
  public readonly createdAt: Date;
  public readonly status: errorStatusType;
  public statusCode: number;
  public priority: errorPriorityType;
  public categories: errorCategoriesType;
  public readonly context?: AppErrorContextInterface;
  public fields?: object;

  constructor(
    req: CustomRequestInterface,
    errorConfig: AppErrorConfigInterface
  ) {
    const { message, statusCode, fields } = errorConfig;

    super(message);
    this.name = "AppError";

    this._id = uuidv4();
    this.createdAt = new Date();
    this.context = this.setContext(req);
    this.statusCode = statusCode;
    this.status = this.getStatusCodeStatus(statusCode);
    this.setCategories(statusCode);
    this.setPriority();

    if (fields) {
      this.fields = fields;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Sets the priority of the error based on the categories.
   */
  private setPriority(): void {
    switch (this.categories) {
      case "external":
      case "request":
        this.priority = "warning";
        break;

      case "security":
      case "server":
        this.priority = "critical";
        break;

      case "validation":
        this.priority = "info";
        break;
    }
  }

  /**
   * Sets the categories of the error based on the status code.
   * @param statusCode - The status code of the error.
   */
  private setCategories(statusCode: number): void {
    switch (statusCode) {
      case 400:
      case 422:
        this.categories = "validation";
        break;
      case 401:
      case 403:
      case 429:
        this.categories = "security";
        break;

      case 500:
        this.categories = "server";
        break;

      case 404:
      case 408:
        this.categories = "request";
        break;

      case 502:
      case 503:
      case 504:
        this.categories = "external";
        break;

      default:
        this.categories = "server";
        break;
    }
  }

  /**
   * Sets the context of the error.
   * @param req - The request object.
   * @returns The context of the error.
   */
  private setContext(req: CustomRequestInterface): {
    url: string;
    user: Types.ObjectId | null;
  } {
    return {
      url: req.url ? req.url : null,
      user: req.currentUser && req.currentUser._id ? req.currentUser._id : null,
    };
  }

  /**
   * Returns the status of the error based on the status code.
   * @param statusCode - The status code of the error.
   * @returns The status of the error.
   */
  private getStatusCodeStatus(statusCode: number): errorStatusType {
    return statusCode.toString().startsWith("4") ? "fail" : "error";
  }
}
