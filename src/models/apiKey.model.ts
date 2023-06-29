import { Schema, model } from "mongoose";
import { ApiKeyInterface } from "../shared/interfaces";
import { AppMessage } from "../shared/messages";

import { apiNameType } from "../shared/types/types";
import ApiKeyManager from "../shared/utils/createApiKey.utils";

const apiKeySchema = new Schema<ApiKeyInterface>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [
      true,
      AppMessage.validationMessage.VALIDATE_REQUIRED_FIELD("utilisateur"),
    ],
    unique: true,
  },
  apiKeys: [
    {
      apiName: {
        type: String,
        enum: {
          values: ["Api-travel", "Api-test1", "Api-test2"],
          message: AppMessage.validationMessage.VALIDATE_FIELD("un nom d'API"),
        },
        trim: true,
        required: [
          true,
          AppMessage.validationMessage.VALIDATE_REQUIRED_FIELD("nom de l'api"),
        ],
      },
      apiKey: {
        type: String,
        unique: true,
        trim: true,
      },
      apiKeyExpire: {
        type: Date,
        trim: true,
        default: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      active: {
        type: Boolean,
        default: false,
      },
      renewalToken: { type: String },
      renewalTokenExpire: { type: Date },
    },
  ],
  createAt: {
    type: Date,
    default: Date.now(),
  },
});

apiKeySchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "email firstname lastname" });
  next();
});

apiKeySchema.methods.checkUserApiKeys = function (
  this: ApiKeyInterface,
  userApiKeys: ApiKeyInterface,
  apiName: apiNameType
): boolean {
  if (userApiKeys && userApiKeys.apiKeys.find((el) => el.apiName === apiName)) {
    return false;
  }
  return true;
};

const ApiKey = model<ApiKeyInterface>("ApiKey", apiKeySchema);

export default ApiKey;
