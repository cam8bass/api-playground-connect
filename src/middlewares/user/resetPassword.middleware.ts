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
  createHashRandomToken,
} from "../../shared/utils";

interface CustomRequestInterface extends Request {
  resetToken?: string;
  user?: UserInterface;
  sendEmail?: boolean;
  notification?: NotificationDetailInterface[];
  token?: string;
}

/**
 * Validate password and password confirmation fields
 *
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const validateFields = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { email, password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm || !email) {
      const requiredFields = {
        password: validationMessage.VALIDATE_REQUIRED_FIELD(
          "nouveau mot de passe"
        ),
        passwordConfirm: validationMessage.VALIDATE_REQUIRED_FIELD(
          "nouveau mot de passe de confirmation"
        ),
        email: validationMessage.VALIDATE_REQUIRED_FIELD("adresse email"),
      };

      const errors = fieldErrorMessages(
        { password, passwordConfirm, email },
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
 * Generate hash random token
 *
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const generateHashRandomToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { token } = req.params;
    const resetToken = createHashRandomToken(token);

    req.resetToken = resetToken;
    next();
  }
);

/**
 * Find user by reset token
 *
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const findUserByResetToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { resetToken } = req;
    const { email } = req.body;
    const user = await User.findOne({
      email,
      passwordToken: resetToken,
      passwordTokenExpire: { $gte: new Date(Date.now()) },
    }).select("role email");

    if (!user) {
      return next(
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          fields: {
            form: errorMessage.ERROR_REQUEST_EXPIRED,
          },
        })
      );
    }

    req.user = user;
    next();
  }
);

/**
 * Change user password
 *
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const changeUserPassword = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { password, passwordConfirm } = req.body;
    const { user } = req;

    await user.changeUserPassword(password, passwordConfirm);

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
      { idUser: user._id, role: user.role, authToken: true },
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
 * Send password change email
 *
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
      subject: subjectEmail.SUBJECT__RESET_FIELD("mot de passe"),
      text: bodyEmail.PASSWORD_CHANGED,
    });

    req.sendEmail = sendEmail;
    next();
  }
);

/**
 * Create admin notification
 *
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
          "Changement de mot de passe",
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
 *
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
 * Generate response reset password
 *
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
