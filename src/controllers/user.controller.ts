import { NextFunction, Request, Response } from "express";
import User from "./../models/user.model";
import { UserInterface, userRequestInterface } from "../shared/interfaces";
import {
  bodyEmail,
  errorMessage,
  subjectEmail,
  validationMessage,
  warningMessage,
} from "../shared/messages";
import { Types } from "mongoose";
import bodyFilter from "../shared/utils/filterBodyRequest.utils";
import { fieldErrorMessages } from "../shared/utils/fieldErrorMessage.utils";
import AppError from "../shared/utils/AppError.utils";
import {
  createHashRandomToken,
  createResetRandomToken,
} from "../shared/utils/reset.utils";
import EmailManager from "../shared/utils/EmailManager.utils";
import catchAsync from "../shared/utils/catchAsync.utils";
import { notificationMessage } from "../shared/messages/notification.message";
import { createNotification } from "../shared/utils/notification.utils";
import { jsonResponse } from "../shared/utils/jsonResponse.utils";
import jwt, { JwtPayload } from "jsonwebtoken";
import client from "../infisical";
import { formatUserResponse } from "../shared/utils/formatResponse.utils";

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

    res.status(200).json(
      jsonResponse({
        notification: createNotification(
          "success",
          notificationMessage.NOTIFICATION_SUCCESS_CREATE_ACCOUNT
        ),
      })
    );
  }
);

export const confirmActivationAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const { password } = req.body;
    const { token: resetToken } = req.params;

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

    const hashToken = createHashRandomToken(resetToken);

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

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(401, warningMessage.WARNING_INVALID_FIELD, {
          password: errorMessage.ERROR_WRONG_PASSWORD,
        })
      );
    }
    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT_MODIFIED_STATUS("Activation"),
      text: bodyEmail.ACCOUNT_ACTIVATED,
    });

    const updateUser = await User.findByIdAndUpdate(
      user._id,
      {
        active: true,
        $unset: {
          activationAccountToken: "",
          activationAccountTokenExpire: "",
        },
      },
      { new: true }
    );

    await updateUser.createAndSendToken(
      res,
      new Types.ObjectId(user._id),
      user.role
    );

    if (!sendEmail) {
      res.status(200).json(
        jsonResponse({
          data: formatUserResponse(updateUser, "user"),
          notification: createNotification(
            "fail",
            notificationMessage.NOTIFICATION_SENT_EMAIL_ACTIVATION_ACCOUNT
          ),
        })
      );
    } else {
      res.status(200).json(
        jsonResponse({
          data: formatUserResponse(updateUser, "user"),
          notification: createNotification(
            "success",
            notificationMessage.NOTIFICATION_ACTIVATION_ACCOUNT
          ),
        })
      );
    }
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
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

    let user = await User.findOne<UserInterface>({ email }).select("+password");

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

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(401, warningMessage.WARNING_INVALID_FIELD, {
          password: errorMessage.ERROR_WRONG_LOGIN,
        })
      );
    }

    if (!user.active) {
      if (
        user.activationAccountTokenExpire > new Date(Date.now()) &&
        user.accountLocked
      ) {
        return next(
          new AppError(404, warningMessage.WARNING_INACTIVE_ACCOUNT, {
            request: errorMessage.ERROR_ACTIVATION_ACCOUNT_TOKEN_NOT_EXPIRE,
          })
        );
      }

      if (user.disableAccountAt && user.accountDisabled) {

        user = await User.findByIdAndUpdate(
          user._id,
          {
            active: true,
            accountDisabled:false,
            $unset: {
              disableAccountAt: "",
            },
          },
          { new: true }
        );

        const sendEmail = await EmailManager.send({
          to: user.email,
          subject: subjectEmail.SUBJECT_ACCOUNT_REACTIVATION,
          text: bodyEmail.SEND_NOTIFICATION_ACCOUNT_REACTIVATION,
        });

        if (!sendEmail) {
          return next(
            new AppError(500, warningMessage.WARNING__EMAIL, {
              request: errorMessage.ERROR_SENT_EMAIL_ACTIVATION,
            })
          );
        }
      } else {
        const { resetToken, resetHashToken, dateExpire } =
          createResetRandomToken();

        await user.prepareAccountActivation(resetHashToken, dateExpire);

        const resetUrl = user.createResetUrl(req, resetToken, "activation");

        const sendEmail = await EmailManager.send({
          to: user.email,
          subject: subjectEmail.SUBJECT_MODIFIED_STATUS("Activation"),
          text: bodyEmail.SEND_RESET_URL(resetUrl, 10),
        });

        if (!sendEmail) {
          await user.deleteActivationToken();

          return next(
            new AppError(500, warningMessage.WARNING__EMAIL, {
              request: errorMessage.ERROR_SENT_EMAIL_ACTIVATION,
            })
          );
        }

        return res.status(200).json(
          jsonResponse({
            notification: createNotification(
              "success",
              notificationMessage.NOTIFICATION_SENT_EMAIL_ACTIVATION(user.email)
            ),
          })
        );
      }
    }

    await user.createAndSendToken(res, new Types.ObjectId(user._id), user.role);

    return res
      .status(200)
      .json(jsonResponse({ data: formatUserResponse(user, "user") }));
  }
);

export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("jwt", "", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      sameSite: "strict",
    });

    res.status(200).end();
  }
);

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return next(
        new AppError(400, warningMessage.WARNING__REQUIRE_FIELD, {
          email: validationMessage.VALIDATE_REQUIRED_FIELD("adresse email"),
        })
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
      return next(
        new AppError(
          400,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_WRONG_EMAIL,
          }
        )
      );
    }

    const resetUrl = user.createResetUrl(req, resetToken, "password");

    const emailSend = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT__RESET_FIELD("mot de passe"),
      text: bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    if (!emailSend) {
      await user.deletePasswordResetToken();

      return next(
        new AppError(500, warningMessage.WARNING__EMAIL, {
          request: errorMessage.ERROR_SENT_EMAIL_RESET_PASSWORD,
        })
      );
    }

    res.status(200).json(
      jsonResponse({
        notification: createNotification(
          "success",
          notificationMessage.NOTIFICATION_SENT_EMAIL_RESET_PASSWORD(user.email)
        ),
      })
    );
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm) {
      const requiredFields = {
        password: validationMessage.VALIDATE_REQUIRED_FIELD(
          "nouveau mot de passe"
        ),
        passwordConfirm: validationMessage.VALIDATE_REQUIRED_FIELD(
          "nouveau mot de passe de confirmation"
        ),
      };

      const errors = fieldErrorMessages(
        { password, passwordConfirm },
        requiredFields
      );

      return next(
        new AppError(400, warningMessage.WARNING__REQUIRE_FIELD, errors)
      );
    }

    const passwordResetToken = createHashRandomToken(req.params.token);

    const user = await User.findOne({
      passwordResetToken,
      passwordResetTokenExpire: { $gte: new Date(Date.now()) },
    }).select("role email");

    if (!user) {
      return next(
        new AppError(
          401,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_REQUEST_EXPIRED,
          }
        )
      );
    }

    await user.changeUserPassword(password, passwordConfirm);

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT__RESET_FIELD("mot de passe"),
      text: bodyEmail.PASSWORD_CHANGED,
    });

    await user.createAndSendToken(res, new Types.ObjectId(user._id), user.role);

    if (!sendEmail) {
      res.status(200).json(
        jsonResponse({
          notification: createNotification(
            "fail",
            notificationMessage.NOTIFICATION_SENT_EMAIL_PASSWORD_CHANGED
          ),
        })
      );
    } else {
      res.status(200).json(
        jsonResponse({
          notification: createNotification(
            "success",
            notificationMessage.NOTIFICATION_PASSWORD_MODIFIED
          ),
        })
      );
    }
  }
);

export const updatePassword = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const { password, newPassword, passwordConfirm } = req.body;

    if (!password || !newPassword || !passwordConfirm) {
      const requiredFields = {
        password: validationMessage.VALIDATE_REQUIRED_FIELD(
          "mot de passe actuel"
        ),
        newPassword:
          validationMessage.VALIDATE_REQUIRED_FIELD("nouveau de passe"),
        passwordConfirm: validationMessage.VALIDATE_REQUIRED_FIELD(
          "nouveau mot de passe de confirmation"
        ),
      };

      const errors = fieldErrorMessages(
        { password, newPassword, passwordConfirm },
        requiredFields
      );

      return next(
        new AppError(400, warningMessage.WARNING__REQUIRE_FIELD, errors)
      );
    }

    const user = await User.findById(new Types.ObjectId(req.user._id)).select(
      "+password role email loginFailures accountLockedExpire accountLocked"
    );

    if (!user) {
      return next(
        new AppError(
          401,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_LOGIN_REQUIRED,
          }
        )
      );
    }

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(400, warningMessage.WARNING_INVALID_FIELD, {
          password: errorMessage.ERROR_WRONG_PASSWORD,
        })
      );
    }

    await user.changeUserPassword(newPassword, passwordConfirm);

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT_FIELD_CHANGED("mot de passe"),
      text: bodyEmail.PASSWORD_CHANGED,
    });

    await user.createAndSendToken(res, new Types.ObjectId(user._id), user.role);

    if (!sendEmail) {
      res.status(200).json(
        jsonResponse({
          notification: createNotification(
            "fail",
            notificationMessage.NOTIFICATION_SENT_EMAIL_PASSWORD_CHANGED
          ),
        })
      );
    } else {
      res.status(200).json(
        jsonResponse({
          notification: createNotification(
            "success",
            notificationMessage.NOTIFICATION_PASSWORD_MODIFIED
          ),
        })
      );
    }
  }
);

export const getMe = catchAsync(
  async (req: userRequestInterface, res: Response) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split("Bearer ").at(1);
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(204).end();
    }

    const { secretValue: jwtSecret } = await client.getSecret("JWT_SECRET");

    const decoded = jwt.verify(req.cookies.jwt, jwtSecret) as JwtPayload;

    const currentUser = await User.findOne({
      _id: decoded.id,
    });

    if (
      !currentUser ||
      currentUser.checkPasswordChangedAfterToken(decoded.iat) ||
      currentUser.checkEmailChangedAfterToken(decoded.iat)
    ) {
      return res.status(204).end();
    }

    res
      .status(200)
      .json(jsonResponse({ data: formatUserResponse(currentUser, "user") }));
  }
);

export const updateUserProfile = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const { password } = req.body;

    if (password) {
      return next(
        new AppError(400, warningMessage.WARNING_MANIPULATE_FIELD, {
          request: errorMessage.ERROR_WRONG_PASSWORD_ROUTE,
        })
      );
    }

    const filteredBody = bodyFilter<UserInterface>(
      req.body,
      "firstname",
      "lastname"
    );

    if (Object.entries(filteredBody).length === 0) {
      return next(
        new AppError(400, warningMessage.WARNING_EMPTY_MODIFICATION, {
          request: errorMessage.ERROR_EMPTY_USER_MODIFICATION,
        })
      );
    }

    const user = await User.findByIdAndUpdate(
      new Types.ObjectId(req.user._id),
      filteredBody,
      {
        runValidators: true,
        new: true,
      }
    );

    if (!user) {
      return next(
        new AppError(
          401,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_LOGIN_REQUIRED,
          }
        )
      );
    }

    await user.createAndSendToken(res, new Types.ObjectId(user._id), user.role);

    const keyMapping = {
      firstname: "Nom",
      lastname: "Prénom",
    };

    const modifiedFields = Object.keys(filteredBody).map(
      (key) => keyMapping[key] || key
    );

    res.status(200).json(
      jsonResponse({
        notification: createNotification(
          "success",
          notificationMessage.NOTIFICATION_FIELDS_MODIFIED(modifiedFields)
        ),

        data: formatUserResponse(user, "user"),
      })
    );
  }
);

export const emailChangeRequest = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const { resetToken, resetHashToken, dateExpire } = createResetRandomToken();

    const user = await User.findByIdAndUpdate(
      new Types.ObjectId(req.user._id),
      {
        emailResetToken: resetHashToken,
        emailResetTokenExpire: dateExpire,
      }
    ).select("email");

    if (!user) {
      return next(
        new AppError(
          401,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_LOGIN_REQUIRED,
          }
        )
      );
    }

    const resetUrl = user.createResetUrl(req, resetToken, "email");

    const emailSend = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT__RESET_FIELD("email"),
      text: bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    if (!emailSend) {
      await user.deleteEmailResetToken();

      return next(
        new AppError(500, warningMessage.WARNING__EMAIL, {
          request: errorMessage.ERROR_SENT_EMAIL_RESET_EMAIL,
        })
      );
    }

    res.status(200).json(
      jsonResponse({
        notification: createNotification(
          "success",
          notificationMessage.NOTIFICATION_SENT_EMAIL_RESET_EMAIL(user.email)
        ),
      })
    );
  }
);

export const confirmChangeEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tokenHash = createHashRandomToken(req.params.token);
    const { email } = req.body;
    const { password } = req.body;
    const { newEmail } = req.body;

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

    if (!(await user.checkUserPassword(password, user.password))) {
      return next(
        new AppError(400, warningMessage.WARNING_INVALID_FIELD, {
          password: errorMessage.ERROR_WRONG_PASSWORD,
        })
      );
    }

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

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT_FIELD_CHANGED("adresse email"),
      text: bodyEmail.SEND_NOTIFICATION_EMAIL_CHANGED(newEmail),
    });

    await updateUser.createAndSendToken(
      res,
      new Types.ObjectId(user._id),
      user.role
    );

    if (!sendEmail) {
      res.status(200).json(
        jsonResponse({
          data: formatUserResponse(updateUser, "user"),
          notification: createNotification(
            "fail",
            notificationMessage.NOTIFICATION_SENT_EMAIL_CHANGED
          ),
        })
      );
    } else {
      res.status(200).json(
        jsonResponse({
          data: formatUserResponse(updateUser, "user"),
          notification: createNotification(
            "success",
            notificationMessage.NOTIFICATION_EMAIL_MODIFIED
          ),
        })
      );
    }
  }
);

export const disableUserAccount = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const user = await User.findByIdAndUpdate(
      new Types.ObjectId(req.user._id),
      {
        active: false,
        accountDisabled:true,
        disableAccountAt: new Date(),
      }
    ).select("email");

    if (!user) {
      return next(
        new AppError(
          401,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_LOGIN_REQUIRED,
          }
        )
      );
    }

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: subjectEmail.SUBJECT_MODIFIED_STATUS("Désactivation"),
      text: bodyEmail.ACCOUNT_DISABLED,
    });

    res.cookie("jwt", "", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      sameSite: "strict",
    });

    if (!sendEmail) {
      res.status(200).json(
        jsonResponse({
          notification: createNotification(
            "fail",
            notificationMessage.NOTIFICATION_EMAIL_DISABLE_ACCOUNT
          ),
        })
      );
    } else {
      res.status(200).json(
        jsonResponse({
          notification: createNotification(
            "success",
            notificationMessage.NOTIFICATION_SENT_EMAIL_DISABLE_ACCOUNT(
              user.email
            )
          ),
        })
      );
    }
  }
);
