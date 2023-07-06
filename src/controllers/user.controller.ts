import { NextFunction, Request, Response } from "express";
import User from "./../models/user.model";
import catchAsync from "../shared/utils/catchAsync.utils";
import AppError from "../shared/utils/AppError.utils";
import {
  ApiKeyInterface,
  UserInterface,
  userRequestInterface,
} from "../shared/interfaces";
import bodyFilter from "../shared/utils/filterBodyRequest.utils";
import { AppMessage } from "../shared/messages";
import EmailManager from "../shared/utils/EmailManager.utils";
import { emailMessages } from "../shared/messages";
import ApiKeyManager from "../shared/utils/createApiKey.utils";
import { Types } from "mongoose";
import {
  createHashRandomToken,
  createResetRandomToken,
} from "../shared/utils/reset.utils";

export const signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const filteredBody = bodyFilter<UserInterface>(
      req.body,
      "firstname",
      "lastname",
      "email",
      "password",
      "passwordConfirm"
    );

    await User.create(filteredBody);

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_CREATE_ACCOUNT,
    });
  }
);

export const confirmActivationAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const { password } = req.body;
    const { token: resetToken } = req.params;

    if (!email || !password) {
      return next(new AppError(AppMessage.errorMessage.ERROR_EMPTY_LOGIN, 400));
    }

    const hashToken = createHashRandomToken(resetToken);

    const user = await User.findOne({
      email,
      activationAccountToken: hashToken,
      activationAccountTokenExpire: { $gte: Date.now() },
    }).select("+password email role loginFailures accountLockedExpire");

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LINK_ACTIVATION_EXPIRED, 404)
      );
    }

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_WRONG_PASSWORD, 401)
      );
    }

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: emailMessages.subjectEmail.SUBJECT_MODIFIED_STATUS("Activation"),
      text: emailMessages.bodyEmail.ACCOUNT_ACTIVATED,
    });

    if (!sendEmail) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_NOTIFICATION_ACTIVATION_ACCOUNT,
          500
        )
      );
    }

    await user.updateOne({
      active: true,
      $unset: {
        activationAccountToken: "",
        activationAccountTokenExpire: "",
      },
    });

    const token = await user.createAndSendToken(
      res,
      new Types.ObjectId(user._id),
      user.role
    );

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_ACTIVATION_ACCOUNT,
      token,
    });
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError(AppMessage.errorMessage.ERROR_EMPTY_LOGIN, 401));
    }

    const user = await User.findOne<UserInterface>({ email }).select(
      "+password loginFailures role activationAccountTokenExpire disableAccountAt email active"
    );

    if (!user) {
      return next(new AppError(AppMessage.errorMessage.ERROR_WRONG_LOGIN, 401));
    }

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(new AppError(AppMessage.errorMessage.ERROR_WRONG_LOGIN, 404));
    }

    if (!user.active) {
      if (user.activationAccountTokenExpire > new Date(Date.now())) {
        return next(
          new AppError(
            AppMessage.errorMessage.ERROR_ACTIVATION_ACCOUNT_TOKEN_NOT_EXPIRE,
            404
          )
        );
      }

      if (user.disableAccountAt) {
        await user.reactivatedUserAccount();

        const sendEmail = await EmailManager.send({
          to: user.email,
          subject: emailMessages.subjectEmail.SUBJECT_ACCOUNT_REACTIVATION,
          text: emailMessages.bodyEmail.SEND_NOTIFICATION_ACCOUNT_REACTIVATION,
        });

        if (!sendEmail) {
          return next(
            new AppError(
              AppMessage.errorMessage.ERROR_SENT_EMAIL_ACTIVATION,
              500
            )
          );
        }
      } else {
        const { resetToken, resetHashToken, dateExpire } =
          createResetRandomToken();

        await user.activeUserAccount(resetHashToken, dateExpire);

        const resetUrl = user.createResetUrl(req, resetToken, "activation");

        const sendEmail = await EmailManager.send({
          to: user.email,
          subject:
            emailMessages.subjectEmail.SUBJECT_MODIFIED_STATUS("Activation"),
          text: emailMessages.bodyEmail.SEND_RESET_URL(resetUrl, 10),
        });

        if (!sendEmail) {
          await user.deleteActivationToken();

          return next(
            new AppError(
              AppMessage.errorMessage.ERROR_SENT_EMAIL_ACTIVATION,
              500
            )
          );
        }

        return res.status(200).json({
          status: "success",
          message: AppMessage.successMessage.SUCCESS_SENT_EMAIL_ACTIVATION(
            user.email
          ),
        });
      }
    }

    const token = await user.createAndSendToken(
      res,
      new Types.ObjectId(user.id),
      user.role
    );

    res.status(200).json({
      status: "success",
      token,
    });
  }
);

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_EMPTY_FIELD("adresse email"),
          400
        )
      );
    }
    const { resetToken, resetHashToken, dateExpire } = createResetRandomToken();

    const user = await User.findOneAndUpdate(
      {
        email,
      },
      {
        passwordResetToken: resetHashToken,
        passwordResetTokenExpire: dateExpire,
      }
    ).select("email");

    if (!user) {
      return next(new AppError(AppMessage.errorMessage.ERROR_WRONG_EMAIL, 400));
    }

    const resetUrl = user.createResetUrl(req, resetToken, "password");

    const emailSend = await EmailManager.send({
      to: user.email,
      subject: emailMessages.subjectEmail.SUBJECT__RESET_FIELD("mot de passe"),
      text: emailMessages.bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    if (!emailSend) {
      await user.deletePasswordResetToken();

      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_EMAIL_RESET_PASSWORD,
          500
        )
      );
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_SENT_EMAIL_RESET_PASSWORD(
        user.email
      ),
    });
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_EMPTY_FIELD(
            "nouveau mot de passe",
            "nouveau mot de passe de confirmation"
          ),
          400
        )
      );
    }
    const passwordResetToken = createHashRandomToken(req.params.token);

    const user = await User.findOne({
      passwordResetToken,
      passwordResetTokenExpire: { $gte: new Date(Date.now()) },
    }).select("role email");

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_REQUEST_EXPIRED, 401)
      );
    }

    await user.changeUserPassword(password, passwordConfirm);

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: emailMessages.subjectEmail.SUBJECT__RESET_FIELD("mot de passe"),
      text: emailMessages.bodyEmail.PASSWORD_CHANGED,
    });

    if (!sendEmail) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_NOTIFICATION_PASSWORD_CHANGED,
          500
        )
      );
    }

    const token = await user.createAndSendToken(
      res,
      new Types.ObjectId(user.id),
      user.role
    );

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_PASSWORD_MODIFIED,
      token,
    });
  }
);

export const updatePassword = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const { password, newPassword, newPasswordConfirm } = req.body;

    if (!password || !newPassword || !newPasswordConfirm) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_EMPTY_FIELD(
            "mot de passe actuel",
            "nouveau de passe",
            "nouveau mot de passe de confirmation"
          ),
          400
        )
      );
    }
    const user = await User.findById(new Types.ObjectId(req.user.id)).select(
      "+password role email loginFailures accountLockedExpire "
    );

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_WRONG_PASSWORD, 400)
      );
    }

    await user.changeUserPassword(newPassword, newPasswordConfirm);

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: emailMessages.subjectEmail.SUBJECT_FIELD_CHANGED("mot de passe"),
      text: emailMessages.bodyEmail.PASSWORD_CHANGED,
    });

    if (!sendEmail) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_NOTIFICATION_PASSWORD_CHANGED,
          500
        )
      );
    }
    const token = await user.createAndSendToken(
      res,
      new Types.ObjectId(user.id),
      user.role
    );

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_PASSWORD_MODIFIED,
      token,
    });
  }
);

export const getMe = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const user = await User.findOne({ _id: new Types.ObjectId(req.user.id) })
      .select("firstname lastname email role ")
      .populate({
        path: "apiKeys",
        select:
          "apiKeys.apiName apiKeys.apiKey apiKeys.apiKeyExpire apiKeys._id apiKeys.active",
      });

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }

    const transformUser = {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      id: new Types.ObjectId(user._id),
      apiKeys: await Promise.all(
        user.apiKeys.flatMap((el: Partial<ApiKeyInterface>) =>
          el.apiKeys.map(async (el) => ({
            id: new Types.ObjectId(el._id),
            active: el.active,
            apiName: el.apiName,
            apiKeyExpire: el.apiKeyExpire,
            apiKey: el.apiKey
              ? await ApiKeyManager.decryptApiKey(el.apiKey)
              : undefined,
          }))
        )
      ),
    };

    res.status(200).json({
      status: "success",
      data: {
        user: transformUser,
      },
    });
  }
);

export const updateUserProfile = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const { password } = req.body;

    if (password) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_WRONG_PASSWORD_ROUTE, 400)
      );
    }

    const filteredBody = bodyFilter<UserInterface>(
      req.body,
      "firstname",
      "lastname"
    );

    if (Object.entries(filteredBody).length === 0) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_EMPTY_USER_MODIFICATION, 400)
      );
    }

    const user = await User.findByIdAndUpdate(
      new Types.ObjectId(req.user.id),
      filteredBody,
      {
        runValidators: true,
      }
    ).select("_id");

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_FIELDS_MODIFIED(
        Object.keys(filteredBody)
      ),
    });
  }
);

export const emailChangeRequest = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const { resetToken, resetHashToken, dateExpire } = createResetRandomToken();

    const user = await User.findByIdAndUpdate(new Types.ObjectId(req.user.id), {
      emailResetToken: resetHashToken,
      emailResetTokenExpire: dateExpire,
    }).select("email");

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }

    const resetUrl = user.createResetUrl(req, resetToken, "email");

    const emailSend = await EmailManager.send({
      to: user.email,
      subject: emailMessages.subjectEmail.SUBJECT__RESET_FIELD("email"),
      text: emailMessages.bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    if (!emailSend) {
      await user.deleteEmailResetToken();

      return next(
        new AppError(AppMessage.errorMessage.ERROR_SENT_EMAIL_RESET_EMAIL, 500)
      );
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_SENT_EMAIL_RESET_EMAIL(
        user.email
      ),
    });
  }
);

export const confirmChangeEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tokenHash = createHashRandomToken(req.params.token);
    const { email } = req.body;
    const { password } = req.body;
    const { newEmail } = req.body;

    if (!newEmail || !email || !password) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_EMPTY_FIELD(
            "nouvelle adresse e-mail",
            "adresse email actuel",
            "mot de passe"
          ),
          400
        )
      );
    }

    const user = await User.findOne({
      email,
      emailResetToken: tokenHash,
      emailResetTokenExpire: { $gte: new Date(Date.now()) },
    }).select(
      "+password email loginFailures accountLockedExpire emailResetToken emailResetTokenExpire"
    );

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_REQUEST_EXPIRED, 401)
      );
    }

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_WRONG_PASSWORD, 400)
      );
    }

    await user.changeUserEmail(newEmail);

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject:
        emailMessages.subjectEmail.SUBJECT_FIELD_CHANGED("adresse email"),
      text: emailMessages.bodyEmail.SEND_NOTIFICATION_EMAIL_CHANGED(newEmail),
    });

    if (!sendEmail) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_NOTIFICATION_EMAIL_CHANGED,
          500
        )
      );
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_EMAIL_MODIFIED,
    });
  }
);

export const disableUserAccount = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const user = await User.findByIdAndUpdate(new Types.ObjectId(req.user.id), {
      active: false,
      disableAccountAt: new Date(),
    }).select("email");

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }

    const emailSend = await EmailManager.send({
      to: user.email,
      subject:
        emailMessages.subjectEmail.SUBJECT_MODIFIED_STATUS("Désactivation"),
      text: emailMessages.bodyEmail.ACCOUNT_DISABLED,
    });

    if (!emailSend) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_EMAIL_DISABLE_ACCOUNT,
          500
        )
      );
    }

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_SENT_EMAIL_DISABLE_ACCOUNT(
        user.email
      ),
    });
  }
);
