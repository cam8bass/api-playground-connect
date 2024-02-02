import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { User,Notification } from "../../models";
import { UserInterface, NotificationDetailInterface } from "../../shared/interfaces";
import { validationMessage, warningMessage, errorMessage, subjectEmail, bodyEmail } from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import { catchAsync, fieldErrorMessages, AppError, createHashRandomToken, EmailManager, jsonResponse, formatUserResponse } from "../../shared/utils";

interface CustomRequestInterface extends Request {
  tokenHash?: string;
  user?: UserInterface;
  updatedUser?: UserInterface;
  sendEmail?: boolean;
  notification?: NotificationDetailInterface[];
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
    req.user = user;

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
    const { user } = req;

    if (!(await user.checkUserPassword(password, user.password))) {
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
    const { user } = req;
    const updateUser = await User.findByIdAndUpdate(
      user._id,
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
    const { user, updatedUser } = req;

    await updatedUser.createAndSendToken(
      res,
      new Types.ObjectId(user._id),
      user.role
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
    const { user, updatedUser } = req;

    const sendEmail = await EmailManager.send({
      to: user.email,
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
    let notification: NotificationDetailInterface;

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

    req.notification = req.notification || [];

    if (notification) {
      req.notification.push(notification);
    }

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
        notification,
      })
    );
  }
);

