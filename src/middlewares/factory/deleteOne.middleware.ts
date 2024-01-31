import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import {
  UserInterface,
  ApiKeyInterface,
  NotificationDetailInterface,
  NotificationInterface,
} from "../../shared/interfaces";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import { Model, Types } from "mongoose";
import ApiKey from "../../models/apiKey.model";
import {
  warningMessage,
  errorMessage,
  subjectEmail,
  bodyEmail,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import AppError from "../../shared/utils/AppError.utils";
import EmailManager from "../../shared/utils/EmailManager.utils";
import Notification from "../../models/notification.model";

interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
  notification?: NotificationDetailInterface[];
}

export const deleteOne = <
  T extends UserInterface | ApiKeyInterface | NotificationInterface
>(
  Model: Model<T>,
  target?: "user" | "apiKey" | "notification"
) =>
  catchAsync(
    async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
      const id = new Types.ObjectId(req.params.id);
      const { currentUser } = req;

      let notification: NotificationDetailInterface;

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
        await Notification.findOneAndDelete({ user: id });
        const sendEmail = await EmailManager.send({
          to: (doc as UserInterface).email,
          subject: subjectEmail.SUBJECT_MODIFIED_STATUS("Suppression"),
          text: bodyEmail.ACCOUNT_DELETED,
        });

        if (!sendEmail) {
          notification = await Notification.createNotification(
            currentUser._id,
            "fail",
            notificationMessage.NOTIFICATION_SENT_EMAIL_DELETE_ACCOUNT
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

      notification = await Notification.createNotification(
        currentUser._id,
        "success",
        target === "user"
          ? notificationMessage.NOTIFICATION_DELETE_ACCOUNT
          : target === "apiKey"
          ? notificationMessage.NOTIFICATION_DELETE_USER_APIKEYS
          : null
      );

      req.notification = req.notification || [];

      if (notification) {
        req.notification.push(notification);
      }

      res.status(200).json(
        target === "user" || target === "apiKey"
          ? jsonResponse({
              data: doc,
              notification: req.notification,
            })
          : jsonResponse()
      );
    }
  );
