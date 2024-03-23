import { Document, Types } from "mongoose";
import { apiNameType } from "../types/types";

export interface ApiKeyInterface extends Document {
  user: {
    _id: Types.ObjectId;
    email: string;
  };
  apiKeys: [KeyInterface];
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;

  // METHODS
  checkUserApiKeys: (
    userapiKeys: ApiKeyInterface,
    apiName: apiNameType
  ) => boolean;

  saveRenewalToken: (
    idApi: Types.ObjectId,
    resetHashToken: string,
    dateExpire: Date
  ) => Promise<void>;
  deleteRenewalToken: (idApi: Types.ObjectId) => Promise<void>;
}

export interface KeyInterface {
  apiName: apiNameType;
  apiKey: string;
  apiKeyExpire: Date;
  active: boolean;
  renewalToken: string;
  renewalTokenExpire: Date;
  _id: Types.ObjectId;
  createdAt: Date;
}
