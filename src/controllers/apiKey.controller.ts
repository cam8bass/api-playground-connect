import { NextFunction, Response, Request } from "express";
import catchAsync from "../shared/utils/catchAsync.utils";
import { userRequestInterface } from "../shared/interfaces";
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
    const userApiKeys = await ApiKey.findOne({
      user: new Types.ObjectId(req.user.id),
    }).select("apiKeys.apiName");

    if (userApiKeys && !userApiKeys.checkUserApiKeys(userApiKeys, apiName)) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_DUPLICATE_API_KEY, 400)
      );
    }

    const newApiKey = await ApiKey.findOneAndUpdate(
      {
        user: new Types.ObjectId(req.user.id),
        "apiKeys.apiName": { $ne: apiName },
      },
      {
        $push: {
          apiKeys: {
            apiName: apiName,
          },
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).select("apiKeys.apiName apiKeys._id");

    const idNewApi = newApiKey.apiKeys.find((el) => el.apiName === apiName)._id;

    const sendEmail = await EmailManager.send({
      to: "admin@email.fr",
      subject: emailMessages.subjectEmail.SUBJECT_ADMIN_VALID_NEW_API_KEY,
      text: emailMessages.bodyEmail.SEND_ADMIN_CREATION_REQUEST_API_KEY_NOTIFICATION(
        apiName,
        idNewApi,
        new Types.ObjectId(req.user.id)
      ),
    });

    if (!sendEmail) {
      const updatedUserApiKeys = await ApiKey.findOneAndUpdate(
        {
          user: new Types.ObjectId(req.user.id),
          apiKeys: {
            $elemMatch: {
              apiName: apiName,
            },
          },
        },
        {
          $pull: {
            apiKeys: {
              apiName: apiName,
            },
          },
        },
        { new: true }
      ).select("apiKeys");

      if (updatedUserApiKeys.apiKeys.length < 1) {
        await ApiKey.findByIdAndDelete(
          new Types.ObjectId(updatedUserApiKeys._id)
        );
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
    const idApi = new Types.ObjectId(req.params.idApi);

    const { resetToken, resetHashToken, dateExpire } = createResetRandomToken();

    const apiKey = await ApiKey.findOneAndUpdate(
      {
        user: new Types.ObjectId(req.user.id),
        apiKeys: {
          $elemMatch: {
            _id: idApi,
            apiKeyExpire: { $gte: new Date() },
            active: true,
          },
        },
      },
      {
        $set: {
          "apiKeys.$.renewalToken": resetHashToken,
          "apiKeys.$.renewalTokenExpire": dateExpire,
        },
      }
    ).select("_id");

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
      await ApiKey.findOneAndUpdate(
        {
          user: new Types.ObjectId(req.user.id),

          apiKeys: {
            $elemMatch: {
              _id: idApi,
              apiKeyExpire: { $gte: new Date() },
              active: true,
            },
          },
        },
        {
          $unset: {
            "apiKeys.$.renewalTokenExpire": "",
            "apiKeys.$.renewalToken": "",
          },
        }
      );

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
        apiKeys: {
          $elemMatch: {
            apiKeyExpire: { $gte: new Date() },
            renewalTokenExpire: { $gte: new Date() },
            active: true,
          },
        },
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
    ).select("user");

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
        new AppError(AppMessage.errorMessage.ERROR_SENT_API_KEY, 500)
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
      idUser = new Types.ObjectId(req.params.id);
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
      {
        user: idUser,
        apiKeys: {
          $elemMatch: {
            _id: idApi,
          },
        },
      },
      {
        $pull: { apiKeys: { _id: idApi } },
      },
      { new: true }
    ).select('apiKeys');

    if (!apiKey) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_NO_SEARCH_RESULTS, 404)
      );
    }

    if (apiKey.apiKeys.length < 1) {
      await ApiKey.findByIdAndDelete(new Types.ObjectId(apiKey.id));
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_API_KEY_DELETED(idApi),
    });
  }
);
