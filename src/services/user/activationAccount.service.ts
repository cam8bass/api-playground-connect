import { NextFunction, Response, Request } from "express";
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
import { createHashRandomToken } from "../../shared/utils/reset.utils";
import catchAsync from "../../shared/utils/catchAsync.utils";
import Notification from "../../models/notification.model";

interface CustomRequestInterface extends Request {
  token?: string;
  hashToken?: string;
  currentUser?: UserInterface;
  sendEmail?: boolean;
  notification?: NotificationInterface;
}

/**
 * Validate fields
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
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
        new AppError(400, warningMessage.WARNING__REQUIRE_FIELD, errors)
      );
    }

    next();
  }
);

/**
 * Create random token
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createRandomToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { token: resetToken } = req.params;

    const hashToken = createHashRandomToken(resetToken);
    req.hashToken = hashToken;
    next();
  }
);

/**
 * Find user with token
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const findUserWithToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const { hashToken } = req;

    const user = await User.findOne({
      email,
      activationAccountToken: hashToken,
      activationAccountTokenExpire: { $gte: Date.now() },
    }).select("+password email _id");

    if (!user) {
      return next(
        new AppError(
          404,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_LINK_ACTIVATION,
          }
        )
      );
    }

    req.currentUser = user;
    next();
  }
);

/**
 * Verify password field
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const verifyPasswordField = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { password } = req.body;
    const { currentUser } = req;

    if (
      !(await currentUser.checkUserPassword(password, currentUser.password))
    ) {
      return next(
        new AppError(401, warningMessage.WARNING_INVALID_FIELD, {
          password: errorMessage.ERROR_WRONG_PASSWORD,
        })
      );
    }

    next();
  }
);

/**
 * Update user
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const updateUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      {
        active: true,
        $unset: {
          activationAccountToken: "",
          activationAccountTokenExpire: "",
        },
      },
      { new: true }
    );

    req.currentUser = updatedUser;
    next();
  }
);

/**
 * Create and send token
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createAndSendToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    await currentUser.createAndSendToken(
      res,
      new Types.ObjectId(currentUser._id),
      currentUser.role
    );
    next();
  }
);

/**
 * Send email
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    const sendEmail = await EmailManager.send({
      to: currentUser.email,
      subject: subjectEmail.SUBJECT_MODIFIED_STATUS("Activation"),
      text: bodyEmail.ACCOUNT_ACTIVATED,
    });

    req.sendEmail = sendEmail;
    next();
  }
);

/**
 * Create admin notification
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, currentUser } = req;

    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Confirmation activation de compte",
          currentUser._id,
          currentUser.email
        )
      );
    }
    next();
  }
);

/**
 * Create user notification
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail, currentUser } = req;
    let notification: NotificationInterface;

    if (!sendEmail) {
      notification = await Notification.createNotification(
        currentUser._id,
        "fail",
        notificationMessage.NOTIFICATION_SENT_EMAIL_ACTIVATION_ACCOUNT
      );
    } else {
      notification = await Notification.createNotification(
        currentUser._id,
        "success",
        notificationMessage.NOTIFICATION_ACTIVATION_ACCOUNT
      );
    }

    req.notification = notification;
    next();
  }
);

/**
 * Generate response
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, notification } = req;

    res.status(200).json(
      jsonResponse({
        data: formatUserResponse(currentUser, "user"),
        notification: formatNotification(notification),
      })
    );
  }
);

// /**
//  * Confirm activation account middleware
//  */
// export const confirmActivationAccount = [
// validateFields,
// createRandomToken,
// findUserWithToken,
// verifyPasswordField,
// updateUser,
// createAndSendToken,
// sendEmail,
// createAdminNotification,
// createUserNotification,
// generateResponse,
// ];
