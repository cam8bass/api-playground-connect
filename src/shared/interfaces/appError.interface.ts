import { Types } from "mongoose";
import {
  errorCategoriesType,
  errorPriorityType,
  errorStatusType,
} from "../types/types";

export interface AppErrorConfigInterface {
  message: string;
  statusCode: number;
  fields?: object;
}

export interface AppErrorContextInterface {
  user?: Types.ObjectId;
  url?: string;
}

export interface AppErrorInterface extends Error {
  isOperational: boolean;
  categories: errorCategoriesType;
  createdAt: Date;
  status: errorStatusType;
  statusCode: number;
  _id: string;
  priority: errorPriorityType;
  fields?: object;
  context?: AppErrorContextInterface;
}

// export interface AppErrorInterface extends Error {
//   status: errorStatusType;
//   statusCode: number;
//   isOperational: boolean;
//   errors: object;
// }
