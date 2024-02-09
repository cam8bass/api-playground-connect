import { NextFunction, Response, Request } from "express";
import { User, Notification } from "../../models";
import {
  UserInterface,
  NotificationDetailInterface,
} from "../../shared/interfaces";
import {
  subjectEmail,
  bodyEmail,
  errorMessage,
  warningMessage,
} from "../../shared/messages";
import { notificationMessage } from "../../shared/messages/notification.message";
import {
  catchAsync,
  bodyFilter,
  createResetRandomToken,
  EmailManager,
  AppError,
  jsonResponse,
} from "../../shared/utils";

interface CustomRequestInterface extends Request {
  filteredBody?: Partial<UserInterface>;
  user?: UserInterface;
  notification?: NotificationDetailInterface[];
  resetUrl?: string;
  sendEmail?: boolean;
  randomToken?: {
    resetToken: string;
    resetHashToken: string;
    dateExpire: Date;
  };
}

/**
 * Filter the request body for the sign up endpoint
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function in the middleware chain
 */
export const filteredBody = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const filteredBody = bodyFilter<UserInterface>(
      req.body,
      "firstname",
      "lastname",
      "email",
      "password",
      "passwordConfirm"
    );
    req.filteredBody = filteredBody;
    next();
  }
);

export const createResetToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { resetToken, resetHashToken, dateExpire } = createResetRandomToken();

    req.randomToken = { resetToken, resetHashToken, dateExpire };

    next();
  }
);

/**
 * Create a new user account
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function in the middleware chain
 */
export const createUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { filteredBody, randomToken } = req;

    const user = await User.create({
      firstname: filteredBody.firstname,
      lastname: filteredBody.lastname,
      role: "user",
      email: filteredBody.email,
      password: filteredBody.password,
      passwordConfirm: filteredBody.passwordConfirm,
      active: false,
      activationAccountToken: randomToken.resetHashToken,
      activationAccountTokenExpire: randomToken.dateExpire,
    });

    req.user = user;
    next();
  }
);

export const createResetUrl = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, randomToken } = req;

    const resetUrl = user.createResetUrl(
      req,
      randomToken.resetToken,
      "activation"
    );

    req.resetUrl = resetUrl;

    next();
  }
);

export const sendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, resetUrl } = req;

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT_MODIFIED_STATUS("Activation"),
      text: bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    req.sendEmail = sendEmail;

    next();
  }
);

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

export const deleteToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, sendEmail } = req;

    if (!sendEmail) {
      await user.deleteActivationToken();
    }

    next();
  }
);

export const generateErrorSendEmail = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { sendEmail } = req;

    if (!sendEmail) {
      return next(
        new AppError(req, {
          statusCode: 503,
          message: errorMessage.ERROR_SENT_EMAIL_ACTIVATION,
        })
      );
    }

    next();
  }
);

/**
 * Create a new notification for the newly created user
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function in the middleware chain
 */
export const createUserNotification = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user } = req;

    const notification = await Notification.createNotification(
      user._id,
      "success",
      notificationMessage.NOTIFICATION_SENT_EMAIL_ACTIVATION(user.email)
    );

    req.notification = req.notification || [];

    if (notification) {
      req.notification.push(notification);
    }

    next();
  }
);

/**
 * Generate the response for the sign up endpoint
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function in the middleware chain
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { notification } = req;

    res.status(200).json(jsonResponse({ notification }));
  }
);
