import { NextFunction, Request, Response } from "express";
import User from "../models/user.model";
import catchAsync from "../shared/utils/catchAsync.utils";
import AppError from "../shared/utils/AppError.utils";
import bodyFilter from "../shared/utils/filterBodyRequest.utils";
import { AppMessage } from "../shared/messages";
import EmailManager from "../shared/utils/EmailManager.utils";
import { emailMessages } from "../shared/messages";

export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find();

    if (!users) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_NO_SEARCH_RESULTS, 404)
      );
    }

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  }
);

export const getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const user = await User.findById(id);

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_NO_SEARCH_RESULTS, 404)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  }
);

export const deleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_NO_SEARCH_RESULTS, 404)
      );
    }

    const emailSend = await EmailManager.send({
      to: user.email,
      subject:
        emailMessages.subjectEmail.SUBJECT_MODIFIED_STATUS("Suppression"),
      text: emailMessages.bodyEmail.ACCOUNT_DELETED,
    });

    if (!emailSend) {
      return next(
        new AppError(
          AppMessage.errorMessage.ERROR_SENT_NOTIFICATION_DELETE_ACCOUNT,
          500
        )
      );
    }
    
    res.status(200).json({
      status: "success",
      message: AppMessage.successMessage.SUCCESS_DOCUMENT_DELETED(user.id),
    });
  }
);

export const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    const filteredBody = bodyFilter(
      req.body,
      "firstname",
      "lastname",
      "email",
      "active",
      "role",
      "loginFailures"
    );

    const user = await User.findByIdAndUpdate(id, filteredBody, {
      runValidators: true,
      new: true,
    });

    if (!user) {
      return next(
        new AppError(AppMessage.errorMessage.ERROR_NO_SEARCH_RESULTS, 404)
      );
    }

    res.status(200).json({
      status: "sucess",
      message: AppMessage.successMessage.SUCCESS_FIELDS_MODIFIED(
        Object.keys(filteredBody)
      ),
      data: {
        user,
      },
    });
  }
);
