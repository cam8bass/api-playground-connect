import { Request } from "express";
import { UserInterface } from "./user.interface";

export interface userRequestInterface extends Request {
  user?: UserInterface;
}
