import { JwtPayload } from "jsonwebtoken";
import { userRoleType } from "../types/types";

import { Types } from "mongoose";

export interface JwtDecodedInterface extends JwtPayload {
  idUser?: Types.ObjectId;
  idApi?: Types.ObjectId;
  role?: userRoleType;

  authToken?: boolean;
}

export interface JwtPayloadInterface {
  idUser?: Types.ObjectId;
  idApi?: Types.ObjectId;
  role?: userRoleType;

  authToken?: boolean;
}
