import { NextFunction, Request, Response } from "express";
import User from "../models/user.model";
import catchAsync from "../shared/utils/catchAsync.utils";
import AppError from "../shared/utils/AppError.utils";
import bodyFilter from "../shared/utils/filterBodyRequest.utils";
import { AppMessage } from "../shared/messages";
import EmailManager from "../shared/utils/EmailManager.utils";
import { emailMessages } from "../shared/messages";
import ApiKey from "../models/apiKey.model";
import { UserInterface } from "../shared/interfaces";
import ApiKeyManager from "../shared/utils/createApiKey.utils";
import { Types } from "mongoose";
import * as factory from "./factory.controller";

// USERS
export const getAllUsers = factory.getAll(User);

export const getUser = factory.getOne(User, { path: "apiKeys" });

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
      "role",
      "loginFailures"
    );

    if (Object.entries(filteredBody).length === 0) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_EMPTY_USER_MODIFICATION, 400)
      );
    }

    const user = await User.findByIdAndUpdate(id, filteredBody, {
      runValidators: true,
      new: true,
    });

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_NO_SEARCH_RESULTS, 404)
      );
    }

    res.status(200).json({
      status: "sucess",
      message: AppMessage.successMessage.SUCCESS_FIELDS_MODIFIED(
        Object.keys(filteredBody)
      ),
      data: {
        user,
      },
    });
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
        new AppError(AppMessage.errorMessage.ERROR_EMPTY_FIELD("active"), 500)
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
        }
      ).select("user");

      if (!apiKey) {
        return next(
          new AppError(AppMessage.errorMessage.ERROR_NO_SEARCH_RESULTS, 404)
        );
      }

      const sendEmail = await EmailManager.send({
        to: apiKey.user.email,
        subject: emailMessages.subjectEmail.SUBJECT_API_KEY("Création"),
        text: emailMessages.bodyEmail.SEND_API_KEY(newApiKey),
      });

      if (!sendEmail) {
        return next(
          new AppError(
            AppMessage.errorMessage.ERROR_ADMIN_SENT_NEW_API_KEY(
              apiKey.user._id,
              apiKey.user.email
            ),
            500
          )
        );
      }

      res.status(200).json({
        status: "success",
        message: AppMessage.successMessage.SUCCESS_ACTIVE_API_KEY(
          apiKey.user.email
        ),
      });
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
          new AppError(AppMessage.errorMessage.ERROR_NO_SEARCH_RESULTS, 404)
        );
      }

      if (apiKey.apiKeys.length < 1) {
        await ApiKey.findByIdAndDelete(new Types.ObjectId(apiKey._id));
      }

      const sendEmail = await EmailManager.send({
        to: apiKey.user.email,
        subject:
          emailMessages.subjectEmail.SUBJECT_ADMIN_REFUSAL_API_KEY_CREATION,
        text: emailMessages.bodyEmail.REFUSAL_API_KEY_CREATION,
      });

      if (!sendEmail) {
        return next(
          new AppError(
            AppMessage.errorMessage.ERROR_ADMIN_SENT_REFUSAL_API_KEY_CREATION(
              apiKey.user._id,
              apiKey.user.email
            ),
            500
          )
        );
      }
      res.status(200).json({
        status: "success",
        message:
          AppMessage.successMessage.SUCCESS_ADMIN_REFUSAL_API_KEY_CREATION(
            apiKey._id,
            apiKey.user._id
          ),
      });
    }
  }
);
