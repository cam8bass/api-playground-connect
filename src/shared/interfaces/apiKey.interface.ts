import { Document, Types } from "mongoose";
import { apiNameType } from "../types/types";

export interface ApiKeyInterface extends Document {
  user: {
    _id: Types.ObjectId;
    email: string;
  };
  apiKeys: [KeyInterface];
  createAt: Date;
  updateAt: Date;
  _id: Types.ObjectId;

  // METHODS
  checkUserApiKeys: (
    userapiKeys: ApiKeyInterface,
    apiName: apiNameType
  ) => boolean;
}

export interface KeyInterface {
  apiName: apiNameType;
  apiKey: string;
  apiKeyExpire: Date;
  active: boolean;
  renewalToken: string;
  renewalTokenExpire: Date;
  _id: Types.ObjectId;
  createAt: Date;
}
