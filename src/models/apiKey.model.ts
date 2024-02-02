import { Schema, Query, model } from "mongoose";
import { ApiKeyInterface, CustomQuery } from "../shared/interfaces";
import { validationMessage } from "../shared/messages";
import { apiNameType } from "../shared/types/types";
import { ApiKeyManager } from "../shared/utils";



const apiKeySchema = new Schema<ApiKeyInterface>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        validationMessage.VALIDATE_REQUIRED_FIELD("utilisateur"),
      ],
      unique: true,
    },
    apiKeys: [
      {
        apiName: {
          type: String,
          enum: {
            values: ["Api-travel", "Api-test1", "Api-test2"],
            message: validationMessage.VALIDATE_FIELD("un nom d'API"),
          },
          trim: true,
          required: [
            true,
            validationMessage.VALIDATE_REQUIRED_FIELD("nom de l'api"),
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
        createdAt: { type: Date, default: new Date(Date.now()) },
      },
    ],
  },
  { timestamps: true }
);

apiKeySchema.post(/^find/, async function (docs: ApiKeyInterface[]) {
  if (!Array.isArray(docs)) {
    docs = [docs];
  }

  await Promise.all(
    docs.map(async (api) => {
      if (!api || !api.apiKeys) return;
      await Promise.all(
        api.apiKeys.map(async (el) => {
          if (!el.apiKey) return;
          el.apiKey = await ApiKeyManager.decryptApiKey(el.apiKey);
        })
      );
    })
  );
});

apiKeySchema.index({ active: 1, user: 1, apiName: 1 });

apiKeySchema.pre<Query<ApiKeyInterface[], ApiKeyInterface> & CustomQuery>(
  /^find/,
  function (next) {
    this.populate({ path: "user", select: "email" });

    this.select("-__v");

    next();
  }
);

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

export const ApiKey = model<ApiKeyInterface>("ApiKey", apiKeySchema);


