import { NextFunction, Response, Request } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";
import { Types } from "mongoose";
import User from "../../models/user.model";
import { UserInterface, NotificationInterface } from "../../shared/interfaces";
import {
  validationMessage,
  warningMessage,
  errorMessage,
  subjectEmail,
  bodyEmail,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import AppError from "../../shared/utils/AppError.utils";
import EmailManager from "../../shared/utils/EmailManager.utils";
import { fieldErrorMessages } from "../../shared/utils/fieldErrorMessage.utils";
import { formatNotification } from "../../shared/utils/formatNotification";
import { formatUserResponse } from "../../shared/utils/formatResponse.utils";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import { createResetRandomToken } from "../../shared/utils/reset.utils";

interface CustomRequestInterface extends Request {
  currentUser?: UserInterface;
  sendEmail?: boolean;
  randomToken?: {
    resetToken: string;
    resetHashToken: string;
    dateExpire: Date;
  };
  resetUrl?: string;
  notification?: NotificationInterface;
}

/**
 * Validate email and password fields
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const validateFields = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      const requiredFields = {
        email: validationMessage.VALIDATE_REQUIRED_FIELD("email"),
        password: validationMessage.VALIDATE_REQUIRED_FIELD("mot de passe"),
      };

      const errors = fieldErrorMessages({ email, password }, requiredFields);

      return next(
        new AppError(401, warningMessage.WARNING__REQUIRE_FIELD, errors)
      );
    }

    next();
  }
);

/**
 * Verify user for login
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const verifyUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await User.findOne<UserInterface>({ email }).select(
      "+password"
    );

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

    req.currentUser = user;

    next();
  }
);

/**
 * Verify password for login
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const verifyPassword = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { password } = req.body;
    const { currentUser } = req;

    if (
      !(await currentUser.checkUserPassword(password, currentUser.password))
    ) {
      return next(
        new AppError(401, warningMessage.WARNING_INVALID_FIELD, {
          password: errorMessage.ERROR_WRONG_LOGIN,
        })
      );
    }

    next();
  }
);

/**
 * Check if account is inactive
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const checkIfTokenExpire = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    if (!currentUser.active) {
      if (currentUser.activationAccountTokenExpire > new Date(Date.now())) {
        return next(
          new AppError(404, warningMessage.WARNING_INACTIVE_ACCOUNT, {
            request: errorMessage.ERROR_ACTIVATION_ACCOUNT_TOKEN_NOT_EXPIRE,
          })
        );
      }
    }

    next();
  }
);

/**
 * Check if account is disable
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const checkIfAccountIsDisable = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    if (!currentUser.active) {
      if (currentUser.disableAccountAt && currentUser.accountDisabled) {
        const user = await User.findByIdAndUpdate(
          currentUser._id,
          {
            active: true,
            accountDisabled: false,
            $unset: {
              disableAccountAt: "",
            },
          },
          { new: true }
        );
        req.currentUser = user;
      }
    }
    next();
  }
);

/**
 * Send email login
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const sendEmailIfAccountDisable = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;
    if (!currentUser.active) {
      if (currentUser.disableAccountAt && currentUser.accountDisabled) {
        const sendEmail = await EmailManager.send({
          to: currentUser.email,
          subject: subjectEmail.SUBJECT_ACCOUNT_REACTIVATION,
          text: bodyEmail.SEND_NOTIFICATION_ACCOUNT_REACTIVATION,
        });
        req.sendEmail = sendEmail;
      }
    }

    next();
  }
);

export const createAdminNotificationIfAccountDisable = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, sendEmail } = req;
    if (!currentUser.active) {
      if (
        currentUser.disableAccountAt &&
        currentUser.accountDisabled &&
        !sendEmail
      ) {
        await Notification.searchAndSendAdminNotification(
          "error",
          errorMessage.ERROR_SEND_EMAIL(
            "Confirmation activation de compte",
            currentUser._id,
            currentUser.email
          )
        );
      }
    }

    next();
  }
);

export const generateErrorSendEmailIfAccountDisable = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, sendEmail } = req;
    if (!currentUser.active) {
      if (
        currentUser.disableAccountAt &&
        currentUser.accountDisabled &&
        !sendEmail
      ) {
        return next(
          new AppError(500, warningMessage.WARNING__EMAIL, {
            request: errorMessage.ERROR_SENT_EMAIL_ACTIVATION,
          })
        );
      }
    }

    next();
  }
);

export const createResetToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;
    if (!currentUser.active) {
      if (!currentUser.disableAccountAt && !currentUser.accountDisabled) {
        const { resetToken, resetHashToken, dateExpire } =
          createResetRandomToken();

        req.randomToken = { resetToken, resetHashToken, dateExpire };
      }
    }
    next();
  }
);

export const prepareAccountForActivation = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, randomToken } = req;
    if (!currentUser.active) {
      if (!currentUser.disableAccountAt && !currentUser.accountDisabled) {
        await currentUser.prepareAccountActivation(
          randomToken.resetHashToken,
          randomToken.dateExpire
        );
      }
    }

    next();
  }
);

export const createResetUrl = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, randomToken } = req;
    if (!currentUser.active) {
      if (!currentUser.disableAccountAt && !currentUser.accountDisabled) {
        const resetUrl = currentUser.createResetUrl(
          req,
          randomToken.resetToken,
          "activation"
        );

        req.resetUrl = resetUrl;
      }
    }

    next();
  }
);

export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, resetUrl } = req;
    if (!currentUser.active) {
      if (!currentUser.disableAccountAt && !currentUser.accountDisabled) {
        const sendEmail = await EmailManager.send({
          to: currentUser.email,
          subject: subjectEmail.SUBJECT_MODIFIED_STATUS("Activation"),
          text: bodyEmail.SEND_RESET_URL(resetUrl, 10),
        });

        req.sendEmail = sendEmail;
      }
    }

    next();
  }
);

export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, currentUser } = req;
    if (!currentUser.active) {
      if (
        !currentUser.disableAccountAt &&
        !currentUser.accountDisabled &&
        !sendEmail
      ) {
        await Notification.searchAndSendAdminNotification(
          "error",
          errorMessage.ERROR_SEND_EMAIL(
            "Confirmation activation de compte",
            currentUser._id,
            currentUser.email
          )
        );
      }
    }

    next();
  }
);

export const deleteToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, sendEmail } = req;
    if (!currentUser.active) {
      if (
        !currentUser.disableAccountAt &&
        !currentUser.accountDisabled &&
        !sendEmail
      ) {
        await currentUser.deleteActivationToken();
      }
    }

    next();
  }
);

export const generateErrorSendEmailIfInactiveAccount = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, sendEmail } = req;
    if (!currentUser.active) {
      if (
        !currentUser.disableAccountAt &&
        !currentUser.accountDisabled &&
        !sendEmail
      ) {
        return next(
          new AppError(500, warningMessage.WARNING__EMAIL, {
            request: errorMessage.ERROR_SENT_EMAIL_ACTIVATION,
          })
        );
      }
    }

    next();
  }
);

export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;
    if (!currentUser.active) {
      if (!currentUser.disableAccountAt && !currentUser.accountDisabled) {
        const notification = await Notification.createNotification(
          currentUser._id,
          "success",
          notificationMessage.NOTIFICATION_SENT_EMAIL_ACTIVATION(
            currentUser.email
          )
        );
        req.notification = notification;
      }
    }
    next();
  }
);

export const generateResponseIfInactiveAccount = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, notification } = req;
    if (!currentUser.active) {
      if (!currentUser.disableAccountAt && !currentUser.accountDisabled) {
        return res.status(200).json(
          jsonResponse({
            notification: formatNotification(notification),
          })
        );
      }
    }
    next();
  }
);

/**
 * Create and send token
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const createAndSendTokenIfActiveAccount = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    if (currentUser.active) {
      await currentUser.createAndSendToken(
        res,
        new Types.ObjectId(currentUser._id),
        currentUser.role
      );
    }
    next();
  }
);

/**
 * Generate response login
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const generateResponseIfActiveAccount = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;
    if (currentUser.active) {
      return res
        .status(200)
        .json(jsonResponse({ data: formatUserResponse(currentUser, "user") }));
    }
    next();
  }
);

// /**
//  * Login middleware
//  */
// export const login = [
//   validateFields,
//   verifyUser,
//   verifyPassword,
//   createAndSendTokenIfActiveAccount,
//   generateResponseIfActiveAccount,
//   checkIfAccountIsLockedOrTokenExpire,
//   checkIfAccountIsDisable,
//   sendEmailIfAccountDisable,
//   createAdminNotificationIfAccountDisable,
//   generateErrorSendEmailIfAccountDisable,
//   createResetToken,
//   prepareAccountForActivation,
//   createResetUrl,
//   sendEmail,
//   createAdminNotification,
//   deleteToken,
//   generateErrorSendEmailIfInactiveAccount,
//   createUserNotification,
//   generateResponseIfInactiveAccount,
// ];
