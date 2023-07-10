import { Request, Response, NextFunction } from "express";
import catchAsync from "../shared/utils/catchAsync.utils";
import AppError from "../shared/utils/AppError.utils";
import { AppMessage, emailMessages } from "../shared/messages";
import { ApiKeyInterface, UserInterface } from "../shared/interfaces";
import { Model, Types, PopulateOptions } from "mongoose";
import EmailManager from "../shared/utils/EmailManager.utils";
import ApiKeyManager from "../shared/utils/createApiKey.utils";
import FilterQuery from "../shared/utils/FilterQuery";
import { apiNameType } from "../shared/types/types";

export const getAll = <T extends Model<UserInterface | ApiKeyInterface>>(
  Model: T
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const query = new FilterQuery(Model.find(), req.query)
      .filter()
      .fields()
      .sort()
      .page();

    const doc = await query.queryMethod.lean();

    if (!doc) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_NO_SEARCH_RESULTS, 404)
      );
    }

    res.status(200).json({
      status: "success",
      results: doc.length,
      data: {
        doc,
      },
    });
  });

export const getOne = <T extends Model<UserInterface | ApiKeyInterface>>(
  Model: T,
  populateOptions?: PopulateOptions
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = new Types.ObjectId(req.params.id);
    const doc = await Model.findById(id).populate(populateOptions);

    if (!doc) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_NO_SEARCH_RESULTS, 404)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

export const deleteOne = <T extends Model<UserInterface | ApiKeyInterface>>(
  Model: T,
  target?: "user"
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = new Types.ObjectId(req.params.id);

    const doc = await Model.findOneAndDelete({ _id: id })
      .select("email")
      .lean();

    if (!doc) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_NO_SEARCH_RESULTS, 404)
      );
    }

    if (target === "user") {
      const emailSend = await EmailManager.send({
        to: (doc as UserInterface).email,
        subject:
          emailMessages.subjectEmail.SUBJECT_MODIFIED_STATUS("Suppression"),
        text: emailMessages.bodyEmail.ACCOUNT_DELETED,
      });

      if (!emailSend) {
        return next(
          new AppError(
            AppMessage.errorMessage.ERROR_SENT_NOTIFICATION_DELETE_ACCOUNT,
            500
          )
        );
      }
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_DOCUMENT_DELETED(id),
    });
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
        return next(
          new AppError(
            AppMessage.errorMessage.ERROR_EMPTY_FIELD(
              "id de l'utilisateur, nom de l'api"
            ),
            400
          )
        );
      }
      const userApiKeys = await Model.findOne<ApiKeyInterface>({
        user: idUser,
      }).select("apiKeys.apiName");

      if (userApiKeys && !userApiKeys.checkUserApiKeys(userApiKeys, apiName)) {
        return next(
          new AppError(AppMessage.errorMessage.ERROR_DUPLICATE_API_KEY, 400)
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
      ).select("user");

      const sendEmail = await EmailManager.send({
        to: query.user.email,
        subject: emailMessages.subjectEmail.SUBJECT_API_KEY("Création"),
        text: emailMessages.bodyEmail.SEND_API_KEY(newApiKey),
      });

      if (!sendEmail) {
        return next(
          new AppError(
            AppMessage.errorMessage.ERROR_ADMIN_SENT_NEW_API_KEY(
              query.user.id,
              query.user.email
            ),
            500
          )
        );
      }
    }

    const doc = await query;

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_DOCUMENT_CREATED(doc._id),
    });
  });
