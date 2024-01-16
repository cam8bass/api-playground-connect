import { NextFunction, Request, Response } from "express";
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
import { createHashRandomToken } from "../../shared/utils/reset.utils";
interface CustomRequestInterface extends Request {
  tokenHash?: string;
  currentUser?: UserInterface;
  updatedUser?: UserInterface;
  sendEmail?: boolean;
  notification?: NotificationInterface;
}

/**
 * Validate fields middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const validateFields = catchAsync(
  async (req: CustomRequestInterface, _res: Response, next: NextFunction) => {
    const { email, password, newEmail } = req.body;

    if (!newEmail || !email || !password) {
      const requiredFields = {
        email: validationMessage.VALIDATE_REQUIRED_FIELD(
          "adresse email actuel"
        ),
        newEmail: validationMessage.VALIDATE_REQUIRED_FIELD(
          "nouvelle adresse e-mail"
        ),
        password: validationMessage.VALIDATE_REQUIRED_FIELD("mot de passe"),
      };

      const errors = fieldErrorMessages(
        { email, password, newEmail },
        requiredFields
      );

      return next(
        new AppError(400, warningMessage.WARNING__REQUIRE_FIELD, errors)
      );
    }

    next();
  }
);

/**
 * Create token hash middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const createTokenHash = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const tokenHash = createHashRandomToken(req.params.token);
    req.tokenHash = tokenHash;

    next();
  }
);

/**
 * Find user middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const findUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const { tokenHash } = req;

    const user = await User.findOne({
      email,
      emailResetToken: tokenHash,
      emailResetTokenExpire: { $gte: new Date(Date.now()) },
    }).select("+password");

    if (!user) {
      return next(
        new AppError(
          401,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_CONFIRM_CHANGE_EMAIL_REQUEST,
          }
        )
      );
    }
    req.currentUser = user;

    next();
  }
);

/**
 * Verify password field middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const verifyPasswordField = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { password } = req.body;
    const { currentUser } = req;

    if (
      !(await currentUser.checkUserPassword(password, currentUser.password))
    ) {
      return next(
        new AppError(400, warningMessage.WARNING_INVALID_FIELD, {
          password: errorMessage.ERROR_WRONG_PASSWORD,
        })
      );
    }

    next();
  }
);

/**
 * Update user middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const updateUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { newEmail } = req.body;
    const { currentUser } = req;
    const updateUser = await User.findByIdAndUpdate(
      currentUser._id,
      {
        emailChangeAt: new Date(Date.now()),
        email: newEmail,
        $unset: {
          emailResetToken: "",
          emailResetTokenExpire: "",
        },
      },
      { new: true }
    );

    req.updatedUser = updateUser;

    next();
  }
);

/**
 * Create and send token
 * @param {CustomRequestInterface} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const createAndSendToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, updatedUser } = req;

    await updatedUser.createAndSendToken(
      res,
      new Types.ObjectId(currentUser._id),
      currentUser.role
    );

    next();
  }
);

/**
 * Send email middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser, updatedUser } = req;

    const sendEmail = await EmailManager.send({
      to: currentUser.email,
      subject: subjectEmail.SUBJECT_FIELD_CHANGED("adresse email"),
      text: bodyEmail.SEND_NOTIFICATION_EMAIL_CHANGED(updatedUser.email),
    });

    req.sendEmail = sendEmail;

    next();
  }
);

/**
 * Create admin notification middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const createAdminNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { updatedUser, sendEmail } = req;

    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Confirmation de changement de l'adresse email",
          updatedUser._id,
          updatedUser.email
        )
      );
    }

    next();
  }
);

/**
 * Create user notification middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { updatedUser, sendEmail } = req;
    let notification: NotificationInterface;

    if (!sendEmail) {
      notification = await Notification.createNotification(
        updatedUser._id,
        "fail",
        notificationMessage.NOTIFICATION_SENT_EMAIL_CHANGED
      );
    } else {
      notification = await Notification.createNotification(
        updatedUser._id,
        "success",
        notificationMessage.NOTIFICATION_EMAIL_MODIFIED
      );
    }

    req.notification = notification;

    next();
  }
);

/**
 * Generate response middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response) => {
    const { notification, updatedUser } = req;

    res.status(200).json(
      jsonResponse({
        data: formatUserResponse(updatedUser, "user"),
        notification: formatNotification(notification),
      })
    );
  }
);

// /**
//  * Confirm change email middleware
//  */

// export const confirmChangeEmail = [
//   validateFields,
//   createTokenHash,
//   findUser,
//   verifyPasswordField,
//   updateUser,
//   createAndSendToken,
//   sendEmail,
//   createAdminNotification,
//   createUserNotification,
//   generateResponse,
// ];
