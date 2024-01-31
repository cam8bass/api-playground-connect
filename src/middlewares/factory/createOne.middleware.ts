import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import {
  ApiKeyInterface,
  NotificationDetailInterface,
  UserInterface,
} from "../../shared/interfaces";
import { Types, Model } from "mongoose";
import {
  errorMessage,
  warningMessage,
  subjectEmail,
  bodyEmail,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import { apiNameType } from "../../shared/types/types";
import AppError from "../../shared/utils/AppError.utils";
import EmailManager from "../../shared/utils/EmailManager.utils";
import ApiKeyManager from "../../shared/utils/createApiKey.utils";
import { fieldErrorMessages } from "../../shared/utils/fieldErrorMessage.utils";

interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
  notification?: NotificationDetailInterface[];
}

export const createOne = <T extends UserInterface | ApiKeyInterface>(
  Model: Model<T>,
  target: "user" | "apiKey"
) =>
  catchAsync(
    async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
      const { currentUser } = req;
      let query: Promise<any> | ApiKeyInterface | UserInterface;
      let notification: NotificationDetailInterface;

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

          const errors = fieldErrorMessages(
            { idUser, apiName },
            requiredFields
          );

          return next(
            new AppError(400, warningMessage.WARNING__REQUIRE_FIELD, errors)
          );
        }

        const userApiKeys = await Model.findOne<ApiKeyInterface>({
          user: idUser,
        }).select("apiKeys.apiName");

        if (
          userApiKeys &&
          !userApiKeys.checkUserApiKeys(userApiKeys, apiName)
        ) {
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
          notification = await Notification.createNotification(
            currentUser._id,
            "fail",
            notificationMessage.NOTIFICATION_ADMIN_SENT_NEW_API_KEY(
              query.user._id,
              query.user.email
            )
          );

          req.notification = req.notification || [];

          if (notification) {
            req.notification.push(notification);
          }

          return res.status(200).json(
            jsonResponse({
              notification: req.notification,
            })
          );
        }
      }

      await query;

      if (target === "user") {
        notification = await Notification.createNotification(
          currentUser._id,
          "success",
          notificationMessage.NOTIFICATION_ADMIN_CREATE_USER
        );

        req.notification = req.notification || [];

        if (notification) {
          req.notification.push(notification);
        }

        res.status(200).json(
          jsonResponse({
            data: query,
            notification: req.notification,
          })
        );
      } else if (target === "apiKey") {
        notification = await Notification.createNotification(
          currentUser._id,
          "success",
          notificationMessage.NOTIFICATION_ADMIN_CREATE_AND_ACTIVE_APIKEY
        );

        req.notification = req.notification || [];

        if (notification) {
          req.notification.push(notification);
        }

        res.status(200).json(
          jsonResponse({
            data: query,
            notification: req.notification,
          })
        );
      }
    }
  );
