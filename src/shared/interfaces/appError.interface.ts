import { errorStatusType } from "../types/types";

export interface AppErrorInterface extends Error {
  status: errorStatusType;
  statusCode: number;
  isOperational: boolean;
  errors: object;
}
