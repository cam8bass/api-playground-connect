import { NextFunction, Response, Request } from "express";
import catchAsync from "../shared/utils/catchAsync.utils";
import { userRequestInterface } from "../shared/interfaces";
import AppError from "../shared/utils/AppError.utils";
import ApiKey from "../models/apiKey.model";
import EmailManager from "../shared/utils/EmailManager.utils";
import {
  bodyEmail,
  errorMessage,
  subjectEmail,
  warningMessage,
} from "../shared/messages";
import ApiKeyManager from "../shared/utils/createApiKey.utils";
import {
  createHashRandomToken,
  createResetRandomToken,
  createResetUrl,
} from "../shared/utils/reset.utils";
import { Types } from "mongoose";
import User from "../models/user.model";
import { fieldErrorMessages } from "../shared/utils/fieldErrorMessage.utils";
import { notificationMessage } from "../shared/messages/notification.message";
import { jsonResponse } from "../shared/utils/jsonResponse.utils";
import { createNotification } from "../shared/utils/notification.utils";

export const apiKeyCreationRequest = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const apiName = req.body.apiName;

    if (!apiName) {
      return next(
        new AppError(400, warningMessage.WARNING_INVALID_FIELD, {
          apiName: errorMessage.ERROR_EMPTY_FIELD("api"),
        })
      );
    }
    const userApiKeys = await ApiKey.findOne({
      user: new Types.ObjectId(req.user._id),
    }).select("apiKeys.apiName");

    if (userApiKeys && !userApiKeys.checkUserApiKeys(userApiKeys, apiName)) {
      return next(
        new AppError(400, warningMessage.WARNING_DUPLICATE_DOCUMENT, {
          request: errorMessage.ERROR_DUPLICATE_API_KEY,
        })
      );
    }

    let newApiKey = await ApiKey.findOneAndUpdate(
      {
        user: new Types.ObjectId(req.user._id),
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
      to: "lc.laignel@gmail.com",
      subject: subjectEmail.SUBJECT_ADMIN_VALID_NEW_API_KEY,
      text: bodyEmail.SEND_ADMIN_CREATION_REQUEST_API_KEY_NOTIFICATION(
        apiName,
        idNewApi,
        new Types.ObjectId(req.user._id)
      ),
    });

    if (!sendEmail) {
      newApiKey = await ApiKey.findOneAndUpdate(
        {
          user: new Types.ObjectId(req.user._id),
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

      if (newApiKey.apiKeys.length < 1) {
        await ApiKey.findByIdAndDelete(new Types.ObjectId(newApiKey._id));
      }

      return next(
        new AppError(500, warningMessage.WARNING__EMAIL, {
          request: errorMessage.ERROR_SENT_EMAIL_CREATE_API_KEY,
        })
      );
    }

    res.status(200).json(
      jsonResponse({
        data: newApiKey,
        notification: createNotification(
          "success",
          notificationMessage.NOTIFICATION_API_KEY_CREATION_REQUEST(
            req.user.email
          )
        ),
      })
    );
  }
);

export const apiKeyRenewalRequest = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const idApi = new Types.ObjectId(req.params.idApi);

    const { resetToken, resetHashToken, dateExpire } = createResetRandomToken();

    const apiKey = await ApiKey.findOneAndUpdate(
      {
        user: new Types.ObjectId(req.user._id),
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
        new AppError(
          404,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("clé d'api"),
          {
            request: errorMessage.ERROR_API_KEY_EXPIRE,
          }
        )
      );
    }

    const resetUrl = createResetUrl(req, resetToken, "api-Key");

    const sendEmail = await EmailManager.send({
      to: req.user.email,
      subject: subjectEmail.SUBJECT_API_KEY("Renouvellement"),
      text: bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    if (!sendEmail) {
      await ApiKey.findOneAndUpdate(
        {
          user: new Types.ObjectId(req.user._id),

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
        new AppError(500, warningMessage.WARNING__EMAIL, {
          request: errorMessage.ERROR_SENT_EMAIL_RENEWAL_API_KEY,
        })
      );
    }

    res.status(200).json(
      jsonResponse({
        notification: createNotification(
          "success",
          notificationMessage.NOTIFICATION_SENT_EMAIL_RENEWAL_API_KEY(
            req.user.email
          )
        ),
      })
    );
  }
);

export const confirmRenewalApiKey = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const renewalToken = createHashRandomToken(req.params.token);

    const { email } = req.body;
    const { password } = req.body;

    if (!email || !password) {
      const requiredFields = {
        email: errorMessage.ERROR_EMPTY_FIELD("adresse email"),
        password: errorMessage.ERROR_EMPTY_FIELD("mot de passe"),
      };

      const errors = fieldErrorMessages({ email, password }, requiredFields);

      return next(
        new AppError(401, warningMessage.WARNING__REQUIRE_FIELD, errors)
      );
    }

    const user = await User.findOne({ email }).select("+password email");

    if (!user) {
      return next(
        new AppError(
          401,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_WRONG_LOGIN,
          }
        )
      );
    }

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(401, warningMessage.WARNING_INVALID_FIELD, {
          password: errorMessage.ERROR_WRONG_LOGIN,
        })
      );
    }

    const newApiKey = ApiKeyManager.createNewApiKey();
    const newApiKeyHash = await ApiKeyManager.encryptApiKey(newApiKey);

    const apiKey = await ApiKey.findOneAndUpdate(
      {
        user: user._id,
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
          "apiKeys.$.createAt": new Date(Date.now()),
          "apiKeys.$.apiKeyExpire": new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ),
        },

        $unset: {
          "apiKeys.$.renewalToken": "",
          "apiKeys.$.renewalTokenExpire": "",
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
            request: errorMessage.ERROR_CONFIRM_RENEWAL_REQUEST,
          }
        )
      );
    }

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT_API_KEY("Renouvellement"),
      text: bodyEmail.SEND_API_KEY(newApiKey),
    });

    if (!sendEmail) {
      res.status(200).json(
        jsonResponse({
          data: apiKey,
          notification: createNotification(
            "fail",
            notificationMessage.NOTIFICATION_SENT_EMAIL_API_KEY
          ),
        })
      );
    } else {
      res.status(200).json(
        jsonResponse({
          data: apiKey,
          notification: createNotification(
            "success",
            notificationMessage.NOTIFICATION_SENT_EMAIL_CREATE_API_KEY(
              apiKey.user.email
            )
          ),
        })
      );
    }
  }
);

export const deleteSelectedApiKey = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    let idUser = new Types.ObjectId(req.user._id);
    const idApi = new Types.ObjectId(req.params.idApi);

    if (req.user.role === "admin") {
      idUser = new Types.ObjectId(req.params.id);
      if (!idUser) {
        return next(
          new AppError(400, warningMessage.WARNING__REQUIRE_FIELD, {
            request: errorMessage.ERROR_EMPTY_FIELD("utilisateur"),
          })
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
    ).select("apiKeys");

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

    res.status(200).json(
      jsonResponse({
        data: apiKey,
        notification: createNotification(
          "success",
          notificationMessage.NOTIFICATION_SUCCESS_DELETE_SELECTED_APIKEY
        ),
      })
    );
  }
);

export const getMyApikey = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const idUser = new Types.ObjectId(req.user._id);

    const apiKeys = await ApiKey.findOne({ user: idUser })
      .select("-apiKeys.renewalToken -apiKeys.renewalTokenExpire")
      .lean();

    if (!apiKeys) {
      return res.status(204).end();
    }

    res.status(200).json(jsonResponse({ data: apiKeys }));
  }
);
