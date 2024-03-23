import { NextFunction, Request, Response } from "express";
import { User, ApiKey, Notification } from "../../models";
import {
  UserInterface,
  ApiKeyInterface,
  NotificationDetailInterface,
} from "../../shared/interfaces";
import {
  errorMessage,
  warningMessage,
  subjectEmail,
  bodyEmail,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import {
  catchAsync,
  fieldErrorMessages,
  AppError,
  ApiKeyManager,
  EmailManager,
  jsonResponse,
  createHashRandomToken,
} from "../../shared/utils";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  renewalToken?: string;
  newApiKey?: string;
  newApiKeyHash?: string;
  apiKey?: ApiKeyInterface;
  sendEmail?: boolean;
  notification?: NotificationDetailInterface[];
}

/**
 * Verifies the fields in the request body.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const verifyFields = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const { password } = req.body;

    if (!email || !password) {
      const requiredFields = {
        email: errorMessage.ERROR_EMPTY_FIELD("adresse email"),
        password: errorMessage.ERROR_EMPTY_FIELD("mot de passe"),
      };

      const errors = fieldErrorMessages({ email, password }, requiredFields);

      return next(
        new AppError(req, {
          statusCode: 400,
          message: warningMessage.WARNING__REQUIRE_FIELD,
          fields: errors,
        })
      );
    }

    next();
  }
);

/**
 * Finds the user based on the email address in the request body.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const findUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await User.findOne({ email }).select("+password email");

    if (!user) {
      return next(
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          fields: {
            form: errorMessage.ERROR_WRONG_LOGIN,
          },
        })
      );
    }

    req.user = user;
    next();
  }
);

/**
 * Checks the user's password against the submitted password.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const checkUserPassword = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { password } = req.body;
    const { user } = req;

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_INVALID_FIELD,
          fields: {
            password: errorMessage.ERROR_WRONG_LOGIN,
          },
        })
      );
    }

    next();
  }
);

/**
 * Creates a renewal token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const createRenewalToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const renewalToken = createHashRandomToken(req.params.token);
    req.renewalToken = renewalToken;
    next();
  }
);

/**
 * Creates a new API key.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const createNewApiKey = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const newApiKey = ApiKeyManager.createNewApiKey();
    req.newApiKey = newApiKey;
    next();
  }
);

/**
 * Creates a hash of the new API key.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const createNewApiKeyHash = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { newApiKey } = req;
    const newApiKeyHash = await ApiKeyManager.encryptApiKey(newApiKey);
    req.newApiKeyHash = newApiKeyHash;
    next();
  }
);

/**
 * Finds and updates the renewal API key.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const findAndUpdateRenewalApiKey = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { renewalToken, user, newApiKeyHash } = req;

    const apiKey = await ApiKey.findOneAndUpdate(
      {
        user: user._id,

        apiKeys: {
          $elemMatch: {
            apiKeyExpire: { $gte: new Date(Date.now()) },
            renewalToken,
            renewalTokenExpire: { $gte: new Date(Date.now()) },
            active: true,
          },
        },
      },
      {
        $set: {
          "apiKeys.$.apiKey": newApiKeyHash,
          "apiKeys.$.createdAt": new Date(Date.now()),
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
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_DOCUMENT_NOT_FOUND("clé d'api"),
          fields: {
            form: errorMessage.ERROR_CONFIRM_RENEWAL_REQUEST,
          },
        })
      );
    }

    req.apiKey = apiKey;
    next();
  }
);

/**
 * Sends an email to the user with the new API key.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, newApiKey } = req;
    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT_API_KEY("Renouvellement"),
      text: bodyEmail.SEND_API_KEY(newApiKey),
    });

    req.sendEmail = sendEmail;
    next();
  }
);

/**
 * Creates an admin notification if the email was not sent.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, user } = req;
    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Confirmation création de clé d'api",
          user._id,
          user.email
        )
      );
    }

    next();
  }
);

/**
 * Creates a user notification if the email was sent.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, user, apiKey } = req;
    let notification: NotificationDetailInterface;

    if (!sendEmail) {
      notification = await Notification.createNotification(
        user._id,
        "fail",
        notificationMessage.NOTIFICATION_SENT_EMAIL_API_KEY
      );
    } else {
      notification = await Notification.createNotification(
        user._id,
        "success",
        notificationMessage.NOTIFICATION_SENT_EMAIL_CREATE_API_KEY(
          apiKey.user.email
        )
      );
    }

    req.notification = req.notification || [];

    if (notification) {
      req.notification.push(notification);
    }

    next();
  }
);

/**
 * Generates the response.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { apiKey, notification } = req;
    res.status(200).json(
      jsonResponse({
        data: apiKey,
        notification,
      })
    );
  }
);
