import { Document, Types } from "mongoose";
import { apiNameType } from "../types/types";
import { UserInterface } from "./user.interface";

export interface ApiKeyInterface extends Document {
  user: Partial<UserInterface>;
  apiKeys: [
    {
      apiName: apiNameType;
      apiKey: string;
      apiKeyExpire: Date;
      active: boolean;
      renewalToken: string;
      renewalTokenExpire: Date;
      _id: Types.ObjectId;
    }
  ];
  createAt: Date;

  // METHODS
  checkUserApiKeys: (
    userapiKeys: ApiKeyInterface,
    apiName: apiNameType
  ) => boolean;
}
