import { NextFunction, Response, Request } from "express";
import catchAsync from "../shared/utils/catchAsync.utils";
import { ApiKeyInterface, userRequestInterface } from "../shared/interfaces";
import AppError from "../shared/utils/AppError.utils";
import { AppMessage } from "../shared/messages";
import ApiKey from "../models/apiKey.model";
import EmailManager from "../shared/utils/EmailManager.utils";
import { emailMessages } from "../shared/messages";
import crypto from "crypto";
import ApiKeyManager from "../shared/utils/createApiKey.utils";
import {
  createResetRandomToken,
  createResetUrl,
} from "../shared/utils/reset.utils";
import { Types } from "mongoose";


export const apiKeyCreationRequest = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const apiName = req.body.apiName;

    if (!apiName) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_EMPTY_FIELD("api"), 400)
      );
    }

    const userApiKeys = await ApiKey.findOne({ user: req.user.id });

    let requestCreateApiKey: ApiKeyInterface | null = null;

    if (!userApiKeys) {
      requestCreateApiKey = await ApiKey.create({
        user: req.user.id,
        apiKeys: [
          {
            apiName,
          },
        ],
      });
    } else {
      if (!userApiKeys.checkUserApiKeys(userApiKeys, apiName)) {
        return next(
          new AppError("Vous disposez deja d'une clé pour cette api", 400)
        );
      }

      requestCreateApiKey = await ApiKey.findOneAndUpdate(
        { user: req.user.id },
        {
          $push: {
            apiKeys: [
              {
                apiName,
              },
            ],
          },
        },
        { runValidators: true, new: true }
      );
    }

    const sendEmail = await EmailManager.send({
      to: "admin@email.fr",
      subject: emailMessages.subjectEmail.SUBJECT_ADMIN_VALID_NEW_API_KEY,
      text: emailMessages.bodyEmail.SEND_ADMIN_CREATION_REQUEST_API_KEY_NOTIFICATION(
        apiName,
        req.user.id
      ),
    });

    if (!sendEmail) {
      requestCreateApiKey.apiKeys.splice(
        requestCreateApiKey.apiKeys.findIndex((el) => el.apiName === apiName),
        1
      );

      if (requestCreateApiKey.apiKeys.length > 0) {
        await requestCreateApiKey.save({ validateBeforeSave: false });
      } else {
        await ApiKey.findByIdAndDelete({ _id: requestCreateApiKey._id });
      }

      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_NOTIFICATION_CREATE_API_KEY,
          500
        )
      );
    }

    res.status(200).json({
      status: "succes",
      message: AppMessage.successMessage.SUCCESS_API_KEY_CREATION_REQUEST(
        req.user.email
      ),
    });
  }
);

export const apiKeyRenewalRequest = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const { idApi } = req.params;

    const { resetToken, resetHashToken, dateExpire } = createResetRandomToken();

    const apiKey = await ApiKey.findOneAndUpdate(
      {
        user: req.user.id,
        "apiKeys._id": idApi,
        apiKeys: {
          $elemMatch: {
            apiKeyExpire: { $gte: new Date() },
          },
        },
      },
      {
        $set: {
          "apiKeys.$.renewalToken": resetHashToken,
          "apiKeys.$.renewalTokenExpire": dateExpire,
        },
      }
    );

    if (!apiKey) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_API_KEY_EXPIRE, 404)
      );
    }

    const resetUrl = createResetUrl(req, resetToken, "api-Key");

    const sendEmail = await EmailManager.send({
      to: req.user.email,
      subject: emailMessages.subjectEmail.SUBJECT_API_KEY("Renouvellement"),
      text: emailMessages.bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    if (!sendEmail) {
      const renewalApiKey = apiKey.apiKeys.find((el) => el.id === idApi);
      renewalApiKey.renewalTokenExpire = undefined;
      renewalApiKey.renewalToken = undefined;
      await apiKey.save({ validateBeforeSave: false });

      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_EMAIL_RENEWAL_API_KEY,
          500
        )
      );
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_SENT_EMAIL_RENEWAL_API_KEY(
        req.user.email
      ),
    });
  }
);

export const confirmRenewalApiKey = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const renewalToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const newApiKey = ApiKeyManager.createNewApiKey();
    const newApiKeyHash = await ApiKeyManager.encryptApiKey(newApiKey);

    const apiKey = await ApiKey.findOneAndUpdate(
      {
        "apiKeys.renewalToken": renewalToken,
        "apiKeys.renewalTokenExpire": { $gte: Date.now() },
      },
      {
        $set: {
          "apiKeys.$.apiKey": newApiKeyHash,
        },

        $unset: {
          "apiKeys.$.renewalToken": "",
          "apiKeys.$.renewalTokenExpire": "",
        },
      }
    );

    if (!apiKey) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_REQUEST_EXPIRED, 404)
      );
    }

    const sendEmail = await EmailManager.send({
      to: apiKey.user.email,
      subject: emailMessages.subjectEmail.SUBJECT_API_KEY("Renouvellement"),
      text: emailMessages.bodyEmail.SEND_API_KEY(newApiKey),
    });

    if (!sendEmail) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_NOTIFICATION_CREATE_API_KEY,
          500
        )
      );
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_SENT_EMAIL_CREATE_API_KEY(
        apiKey.user.email
      ),
    });
  }
);

export const deleteSelectedApiKey = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    let idUser = new Types.ObjectId(req.user.id);
    const idApi = new Types.ObjectId(req.params.idApi);

    if (req.user.role === "admin") {
      idUser = req.body.user;
      if (!idUser) {
        return next(
          new AppError(
            AppMessage.errorMessage.ERROR_EMPTY_FIELD("utilisateur"),
            400
          )
        );
      }
    }

    const apiKey = await ApiKey.findOneAndUpdate(
      { user: idUser },
      {
        $pull: { apiKeys: { _id: idApi } },
      },
      { new: true }
    );

    if (!apiKey) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_NO_SEARCH_RESULTS, 404)
      );
    }

    if (apiKey.apiKeys.length < 1) {
      await ApiKey.findOneAndDelete({ _id: apiKey.id });
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_API_KEY_DELETED(idApi),
    });
  }
);
