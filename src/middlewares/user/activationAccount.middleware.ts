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
  formatUserResponse,
  createJsonWebToken,
  createJwtCookie,
  createHashRandomToken,
} from "../../shared/utils";

interface CustomRequestInterface extends Request {
  token?: string;
  hashToken?: string;
  user?: UserInterface;
  sendEmail?: boolean;
  notification?: NotificationDetailInterface[];
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
      activationToken: hashToken,
      activationTokenExpire: { $gte: Date.now() },
    }).select("+password email _id");

    if (!user) {
      return next(
        new AppError(req, {
          statusCode: 422,
          message: warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          fields: {
            form: errorMessage.ERROR_LINK_ACTIVATION,
          },
        })
      );
    }

    req.user = user;
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
 * Update user
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const updateUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        activationAccountAt:new Date(Date.now()),
        active: true,
        $unset: {
          activationToken: "",
          activationTokenExpire: "",
        },
      },
      { new: true }
    );

    req.user = updatedUser;
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
 * Send email
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
    const { sendEmail, user } = req;

    if (!sendEmail) {
      await Notification.searchAndSendAdminNotification(
        "error",
        errorMessage.ERROR_SEND_EMAIL(
          "Confirmation activation de compte",
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
        notificationMessage.NOTIFICATION_SENT_EMAIL_ACTIVATION_ACCOUNT
      );
    } else {
      notification = await Notification.createNotification(
        user._id,
        "success",
        notificationMessage.NOTIFICATION_ACTIVATION_ACCOUNT
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
 * Generate response
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {function} next - next middleware function
 * @returns {void}
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, notification } = req;

    res.status(200).json(
      jsonResponse({
        data: formatUserResponse(user, "user"),
        notification,
      })
    );
  }
);
