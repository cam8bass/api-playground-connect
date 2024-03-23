import { NextFunction, Response, Request } from "express";

import { User, Notification } from "../../models";
import {
  UserInterface,
  NotificationDetailInterface,
} from "../../shared/interfaces";
import {
  validationMessage,
  warningMessage,
  errorMessage,
  subjectEmail,
  bodyEmail,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import {
  catchAsync,
  fieldErrorMessages,
  AppError,
  EmailManager,
  jsonResponse,
  createJsonWebToken,
  createJwtCookie,
} from "../../shared/utils";

interface CustomRequestInterface extends Request {
  user?: UserInterface;
  currentUser?: UserInterface;
  sendEmail?: boolean;
  notification?: NotificationDetailInterface[];
  token?: string;
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
    const { password, newPassword, passwordConfirm } = req.body;

    if (!password || !newPassword || !passwordConfirm) {
      const requiredFields = {
        password: validationMessage.VALIDATE_REQUIRED_FIELD(
          "mot de passe actuel"
        ),
        newPassword: validationMessage.VALIDATE_REQUIRED_FIELD(
          "nouveau mot de passe"
        ),
        passwordConfirm: validationMessage.VALIDATE_REQUIRED_FIELD(
          "nouveau mot de passe de confirmation"
        ),
      };

      const errors = fieldErrorMessages(
        { password, newPassword, passwordConfirm },
        requiredFields
      );

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
 * Find user to update password
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const findUserUpdatePassword = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { currentUser } = req;

    const user = await User.findById(currentUser._id).select(
      "+password role email loginFailures accountLockedExpire accountLocked"
    );

    if (!user) {
      return next(
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          fields: {
            form: errorMessage.ERROR_LOGIN_REQUIRED,
          },
        })
      );
    }

    req.user = user;
    next();
  }
);

/**
 * Verify current password
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const verifyCurrentPassword = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { password } = req.body;
    const { user } = req;

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_INVALID_FIELD,
          fields: {
            password: errorMessage.ERROR_WRONG_PASSWORD,
          },
        })
      );
    }

    next();
  }
);

/**
 * Change password of user
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const changePasswordUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { newPassword, passwordConfirm } = req.body;
    const { user } = req;

    await user.changeUserPassword(newPassword, passwordConfirm);

    next();
  }
);

/**
 * Create json web token
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createJwtToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;

    const token = await createJsonWebToken(
      { idUser: user._id, role: user.role,authToken:true },
      { expiresIn: "30d" }
    );
    req.token = token;

    next();
  }
);

/**
 * Create cookie with json web token
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const createCookie = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { token } = req;

    await createJwtCookie(res, token);

    next();
  }
);

/**
 * Send email to user with change password instructions
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT_FIELD_CHANGED("mot de passe"),
      text: bodyEmail.PASSWORD_CHANGED,
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
    const { sendEmail, user } = req;
    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Modification du mot de passe en passant par le compte de l'utilisateur",
          user._id,
          user.email
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
    const { sendEmail, user } = req;
    let notification: NotificationDetailInterface;

    if (!sendEmail) {
      notification = await Notification.createNotification(
        user._id,
        "fail",
        notificationMessage.NOTIFICATION_SENT_EMAIL_PASSWORD_CHANGED
      );
    } else {
      notification = await Notification.createNotification(
        user._id,
        "success",
        notificationMessage.NOTIFICATION_PASSWORD_MODIFIED
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
 * Generate response for update password
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { notification } = req;
    res.status(200).json(
      jsonResponse({
        notification,
      })
    );
  }
);
