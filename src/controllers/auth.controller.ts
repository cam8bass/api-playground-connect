import catchAsync from "../shared/utils/catchAsync.utils";
import { Response, NextFunction } from "express";
import User from "../models/user.model";
import AppError from "../shared/utils/AppError.utils";
import jwt, { JwtPayload } from "jsonwebtoken";
import { userRequestInterface } from "../shared/interfaces";
import { userRoleType } from "../shared/types/types";
import { AppMessage, emailMessages } from "../shared/messages";
import client from "../infisical";
import { createResetRandomToken } from "../shared/utils/reset.utils";
import EmailManager from "../shared/utils/EmailManager.utils";

export const accountIsActive = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const email = req.user ? req.user.email : req.body.email;

    const user = req.user
      ? req.user
      : await User.findOne(
          { email },
          "email active activationAccountToken activationAccountTokenExpire disableAccountAt"
        );

    if (!user || user.active) return next();
    // TODO: Voir pour retourner une erreur si active= false
    if (user.activationAccountTokenExpire > new Date(Date.now())) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_ACTIVATION_ACCOUNT_TOKEN_NOT_EXPIRE,
          404
        )
      );
    }

    if (user.disableAccountAt) {
      await user.updateOne({
        active: true,
        $unset: {
          disableAccountAt: "",
        },
      });

      await EmailManager.send({
        to: user.email,
        subject: emailMessages.subjectEmail.SUBJECT_ACCOUNT_REACTIVATION,
        text: emailMessages.bodyEmail.SEND_NOTIFICATION_ACCOUNT_REACTIVATION,
      });

      return next();
    }

    const { resetToken, resetHashToken, dateExpire } = createResetRandomToken();

    const resetUrl = user.createResetUrl(req, resetToken, "activation");

    const sendEmail = await EmailManager.send({
      to: user.email,
      subject: emailMessages.subjectEmail.SUBJECT_MODIFIED_STATUS("Activation"),
      text: emailMessages.bodyEmail.SEND_RESET_URL(resetUrl, 10),
    });

    if (!sendEmail) {
      await user.updateOne({
        $unset: {
          activationAccountToken: "",
          activationAccountTokenExpire: "",
        },
      });

      return next(
        new AppError(AppMessage.errorMessage.ERROR_SENT_EMAIL_ACTIVATION, 500)
      );
    }

    await user.updateOne({
      activationAccountToken: resetHashToken,
      activationAccountTokenExpire: dateExpire,
    });

    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_SENT_EMAIL_ACTIVATION(
        user.email
      ),
    });
  }
);

export const accountIsLocked = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    const email = req.user ? req.user.email : req.body.email;
    const user = req.user
      ? req.user
      : await User.findOne({ email }, "accountLockedExpire");

    if (!user || !user.accountLockedExpire) return next();

    const accountIsLocked =
      Date.parse(user.accountLockedExpire.toString()) > Date.now();

    if (accountIsLocked) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_ACCOUNT_LOCKED, 401)
      );
    }

    await user.updateOne({
      $unset: {
        accountLockedExpire: "",
      },
    });

    next();
  }
);

export const protect = catchAsync(
  async (req: userRequestInterface, res: Response, next: NextFunction) => {
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split("Bearer ").at(1);
    }

    if (!token) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }
    const { secretValue: jwtSecret } = await client.getSecret("JWT_SECRET");

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    const user = await User.findOne({
      _id: decoded.id,
    });

    if (!user || user.checkPasswordChangedAfterToken(decoded.iat)) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401)
      );
    }

    req.user = user;

    next();
  }
);

export const restrictTo = (...userRole: userRoleType[]) =>
  catchAsync(
    async (req: userRequestInterface, res: Response, next: NextFunction) => {
      if (!userRole.includes(req.user.role)) {
        return next(
          new AppError(AppMessage.errorMessage.ERROR_ACCESS_DENIED, 401)
        );
      }

      next();
    }
  );
