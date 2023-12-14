import { Request, Response, NextFunction } from "express";
import catchAsync from "../shared/utils/catchAsync.utils";
import AppError from "../shared/utils/AppError.utils";
import {
  bodyEmail,
  errorMessage,
  subjectEmail,
  warningMessage,
} from "../shared/messages";
import { ApiKeyInterface, UserInterface } from "../shared/interfaces";
import { Model, Types } from "mongoose";
import EmailManager from "../shared/utils/EmailManager.utils";
import ApiKeyManager from "../shared/utils/createApiKey.utils";
import FilterQuery from "../shared/utils/FilterQuery.utils";
import { apiNameType } from "../shared/types/types";
import { fieldErrorMessages } from "../shared/utils/fieldErrorMessage.utils";
import { notificationMessage } from "../shared/messages/notification.message";
import { jsonResponse } from "../shared/utils/jsonResponse.utils";
import { createNotification } from "../shared/utils/notification.utils";
import ApiKey from "../models/apiKey.model";

export const getAll = <T extends UserInterface | ApiKeyInterface>(
  Model: Model<T>
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const query = new FilterQuery(Model.find(), req.query)
      .filter()
      .fields()
      .sort()
      .page()
      .search();

    const [doc, results] = await Promise.all([
      query.queryMethod.lean(),
      Model.countDocuments(query.queryMethod.getFilter()),
    ]);

    res.status(200).json(jsonResponse({ results, data: doc as T[] }));
  });

export const getOne = <T extends UserInterface | ApiKeyInterface>(
  Model: Model<T>
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = new Types.ObjectId(req.params.id);

    const doc: T = await Model.findOne(id).lean();

    if (!doc) {
      return next(
        new AppError(
          404,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("document"),
          {
            request: errorMessage.ERROR_NO_SEARCH_RESULTS,
          }
        )
      );
    }
    res.status(200).json(
      jsonResponse({
        data: doc,
      })
    );
  });

export const deleteOne = <T extends UserInterface | ApiKeyInterface>(
  Model: Model<T>,
  target?: "user"
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = new Types.ObjectId(req.params.id);

    const doc: T = await Model.findOneAndDelete({ _id: id })
      .select("email")
      .lean();

    if (!doc) {
      return next(
        new AppError(
          404,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("document"),
          {
            request: errorMessage.ERROR_NO_SEARCH_RESULTS,
          }
        )
      );
    }

    if (target === "user") {
      await ApiKey.findOneAndDelete({ user: id });

      const sendEmail = await EmailManager.send({
        to: (doc as UserInterface).email,
        subject: subjectEmail.SUBJECT_MODIFIED_STATUS("Suppression"),
        text: bodyEmail.ACCOUNT_DELETED,
      });

      if (!sendEmail) {
        return res.status(200).json(
          jsonResponse({
            notification: createNotification(
              "fail",
              notificationMessage.NOTIFICATION_SENT_EMAIL_DELETE_ACCOUNT
            ),
          })
        );
      }
    }

    res.status(200).json(
      jsonResponse({
        data: doc,
        notification: createNotification(
          "success",
          target === "user"
            ? notificationMessage.NOTIFICATION_DELETE_ACCOUNT
            : notificationMessage.NOTIFICATION_DELETE_USER_APIKEYS
        ),
      })
    );
  });

export const createOne = <T extends UserInterface | ApiKeyInterface>(
  Model: Model<T>,
  target: "user" | "apiKey"
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let query: Promise<any> | ApiKeyInterface | UserInterface;

    if (target === "user") {
      query = Model.create(req.body);
    } else if (target === "apiKey") {
      const idUser: Types.ObjectId = req.body.user;
      const apiName: apiNameType = req.body.apiName;

      if (!idUser || !apiName) {
        const requiredFields = {
          user: errorMessage.ERROR_EMPTY_FIELD("id de l'utilisateur"),
          apiName: errorMessage.ERROR_EMPTY_FIELD("nom de l'api"),
        };

        const errors = fieldErrorMessages({ idUser, apiName }, requiredFields);

        return next(
          new AppError(400, warningMessage.WARNING__REQUIRE_FIELD, errors)
        );
      }

      const userApiKeys = await Model.findOne<ApiKeyInterface>({
        user: idUser,
      }).select("apiKeys.apiName");

      if (userApiKeys && !userApiKeys.checkUserApiKeys(userApiKeys, apiName)) {
        return next(
          new AppError(400, warningMessage.WARNING_DUPLICATE_DOCUMENT, {
            request: errorMessage.ERROR_DUPLICATE_API_KEY,
          })
        );
      }

      const newApiKey = ApiKeyManager.createNewApiKey();
      const newApiKeyHash = await ApiKeyManager.encryptApiKey(newApiKey);

      query = await Model.findOneAndUpdate<ApiKeyInterface>(
        {
          user: idUser,
        },
        {
          $push: {
            apiKeys: {
              apiName: apiName,
              active: true,
              apiKey: newApiKeyHash,
              apiKeyExpire: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          },
        },

        {
          upsert: true,
          runValidators: true,
          new: true,
        }
      );

      const sendEmail = await EmailManager.send({
        to: query.user.email,
        subject: subjectEmail.SUBJECT_API_KEY("Création"),
        text: bodyEmail.SEND_API_KEY(newApiKey),
      });

      if (!sendEmail) {
        return res.status(200).json(
          jsonResponse({
            notification: createNotification(
              "fail",
              notificationMessage.NOTIFICATION_ADMIN_SENT_NEW_API_KEY(
                query.user._id,
                query.user.email
              )
            ),
          })
        );
      }
    }

    await query;

    if (target === "user") {
      res.status(200).json(
        jsonResponse({
          data: query,
          notification: createNotification(
            "success",
            notificationMessage.NOTIFICATION_ADMIN_CREATE_USER
          ),
        })
      );
    } else if (target === "apiKey") {
      res.status(200).json(
        jsonResponse({
          data: query,
          notification: createNotification(
            "success",
            notificationMessage.NOTIFICATION_ADMIN_CREATE_AND_ACTIVE_APIKEY
          ),
        })
      );
    }
  });
