import { NextFunction, Request, Response } from "express";
import User from "../models/user.model";
import catchAsync from "../shared/utils/catchAsync.utils";
import AppError from "../shared/utils/AppError.utils";
import { EMPTY_RESULT } from "../shared/messages";
import bodyFilter from "../shared/utils/filterBodyRequest.utils";

export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find();

    if (!users) {
      return next(new AppError(EMPTY_RESULT, 404));
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
      return next(new AppError(EMPTY_RESULT, 404));
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
      return next(new AppError(EMPTY_RESULT, 404));
    }

    res.status(200).json({
      status: "success",
      message: `Le document ${user.id} a été supprimé avec succès.`,
    });
  }
);

// FIXME:
// -- Voir problème de l'émail du au middleware accountIsLocked

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
      return next(new AppError(EMPTY_RESULT, 404));
    }

    res.status(200).json({
      status: "sucess",
      message: `Vous avez effectué des modifications sur les champs ${Object.keys(
        filteredBody
      )}`,
      data: {
        user,
      },
    });
  }
);
