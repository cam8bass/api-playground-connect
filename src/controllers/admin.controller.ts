import { NextFunction, Request, Response } from "express";
import User from "../models/user.model";
import catchAsync from "../shared/utils/catchAsync.utils";
import AppError from "../shared/utils/AppError.utils";
import bodyFilter from "../shared/utils/filterBodyRequest.utils";

import EmailManager from "../shared/utils/EmailManager.utils";
import {
  bodyEmail,
  errorMessage,
  subjectEmail,
  warningMessage,
} from "../shared/messages";
import ApiKey from "../models/apiKey.model";
import { UserInterface } from "../shared/interfaces";
import ApiKeyManager from "../shared/utils/createApiKey.utils";
import { Types } from "mongoose";
import * as factory from "./factory.controller";
import { jsonResponse } from "../shared/utils/jsonResponse.utils";
import { createNotification } from "../shared/utils/notification.utils";
import { notificationMessage } from "../shared/messages/notification.message";
import { formatUserResponse } from "../shared/utils/formatResponse.utils";

// USERS
export const getAllUsers = factory.getAll(User);

export const getUser = factory.getOne(User);

export const createUser = factory.createOne(User, "user");

export const deleteUser = factory.deleteOne(User, "user");

export const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = new Types.ObjectId(req.params.id);

    const filteredBody = bodyFilter<UserInterface>(
      req.body,
      "firstname",
      "lastname",
      "email",
      "active",
      "role"
    );

    const keyMapping = {
      firstname: "Nom",
      lastname: "Prénom",
      email: "email",
      active: "active",
      role: "rôle",
    };

    const modifiedFields = Object.keys(filteredBody).map(
      (key) => keyMapping[key] || key
    );

    if (Object.entries(filteredBody).length === 0) {
      return next(
        new AppError(400, warningMessage.WARNING_EMPTY_MODIFICATION, {
          request: errorMessage.ERROR_EMPTY_USER_MODIFICATION,
        })
      );
    }

    const user = await User.findByIdAndUpdate(id, filteredBody, {
      runValidators: true,
      new: true,
    });

    if (!user) {
      return next(
        new AppError(
          404,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_NO_SEARCH_RESULTS,
          }
        )
      );
    }

    res.status(200).json(
      jsonResponse({
        data: formatUserResponse(user, "admin"),
        notification: createNotification(
          "success",
          notificationMessage.NOTIFICATION_FIELDS_MODIFIED(modifiedFields)
        ),
      })
    );
  }
);

// API KEYS
export const getAllApiKeys = factory.getAll(ApiKey);

export const getApiKey = factory.getOne(ApiKey);

export const createApiKey = factory.createOne(ApiKey, "apiKey");

export const deleteAllApiKeysFromUser = factory.deleteOne(ApiKey);

export const activeAndcreateApiKey = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const active = req.body.active as boolean;
    const idUser = new Types.ObjectId(req.params.id);
    const idApi = new Types.ObjectId(req.params.idApi);

    if (
      active === undefined ||
      active === null ||
      typeof active !== "boolean"
    ) {
      return next(
        new AppError(500, warningMessage.WARNING__REQUIRE_FIELD, {
          active: errorMessage.ERROR_EMPTY_FIELD("active"),
        })
      );
    }

    if (active === true) {
      const newApiKey = ApiKeyManager.createNewApiKey();
      const newApiKeyHash = await ApiKeyManager.encryptApiKey(newApiKey);

      const apiKey = await ApiKey.findOneAndUpdate(
        {
          user: idUser,
          apiKeys: {
            $elemMatch: {
              _id: idApi,
              active: false,
            },
          },
        },
        {
          $set: {
            "apiKeys.$.active": true,
            "apiKeys.$.apiKey": newApiKeyHash,
            "apiKeys.$.apiKeyExpire": new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ),
          },
        },
        { new: true }
      );

      if (!apiKey) {
        return next(
          new AppError(
            404,
            warningMessage.WARNING_DOCUMENT_NOT_FOUND("clé d'api"),
            {
              request: errorMessage.ERROR_NO_SEARCH_RESULTS,
            }
          )
        );
      }

      const sendEmail = await EmailManager.send({
        to: apiKey.user.email,
        subject: subjectEmail.SUBJECT_API_KEY("Création"),
        text: bodyEmail.SEND_API_KEY(newApiKey),
      });

      if (!sendEmail) {
        return res.status(200).json(
          jsonResponse({
            data: apiKey,
            notification: createNotification(
              "fail",
              notificationMessage.NOTIFICATION_ADMIN_SENT_NEW_API_KEY(
                apiKey.user._id,
                apiKey.user.email
              )
            ),
          })
        );
      } else {
        return res.status(200).json(
          jsonResponse({
            data: apiKey,
            notification: createNotification(
              "success",
              notificationMessage.NOTIFICATION_ACTIVE_API_KEY(apiKey.user.email)
            ),
          })
        );
      }
    } else if (active === false) {
      const apiKey = await ApiKey.findOneAndUpdate(
        {
          user: idUser,
          apiKeys: {
            $elemMatch: {
              _id: idApi,
              active: false,
            },
          },
        },
        {
          $pull: {
            apiKeys: { _id: idApi },
          },
        },
        { new: true }
      ).select("apiKeys._id user");

      if (!apiKey) {
        return next(
          new AppError(
            404,
            warningMessage.WARNING_DOCUMENT_NOT_FOUND("clé d'api"),
            {
              request: errorMessage.ERROR_NO_SEARCH_RESULTS,
            }
          )
        );
      }

      if (apiKey.apiKeys.length < 1) {
        await ApiKey.findByIdAndDelete(new Types.ObjectId(apiKey._id));
      }

      const sendEmail = await EmailManager.send({
        to: apiKey.user.email,
        subject: subjectEmail.SUBJECT_ADMIN_REFUSAL_API_KEY_CREATION,
        text: bodyEmail.REFUSAL_API_KEY_CREATION,
      });

      if (!sendEmail) {
        return res.status(200).json(
          jsonResponse({
            data: apiKey,
            notification: createNotification(
              "fail",
              notificationMessage.NOTIFICATION_ADMIN_SENT_REFUSAL_API_KEY_CREATION(
                apiKey.user._id,
                apiKey.user.email
              )
            ),
          })
        );
      } else {
        return res.status(200).json(
          jsonResponse({
            data: apiKey,
            notification: createNotification(
              "success",
              notificationMessage.NOTIFICATION_ADMIN_REFUSAL_API_KEY
            ),
          })
        );
      }
    }
  }
);

export const getSelectedUserApiKeys = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { idUser } = req.params;
    const apiKeys = await ApiKey.findOne({ user: idUser });

    if (!apiKeys) {
      return res.status(204).end();
    }

    res.status(200).json(jsonResponse({ data: apiKeys }));
  }
);

export const getAllInactiveApiKeys = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const apiKeys = await ApiKey.find({
      "apiKeys.active": false,
    }).lean();

    res.status(200).json(jsonResponse({ data: apiKeys }));
  }
);

export const getAllLockedAccounts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.find({
      accountLocked: true,
      accountLockedExpire: { $gt: new Date(Date.now()) },
    });

    res
      .status(200)
      .json(jsonResponse({ data: formatUserResponse(user, "admin") }));
  }
);
