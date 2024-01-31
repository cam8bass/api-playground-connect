import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";
import {
  UserInterface,
  ApiKeyInterface,
  NotificationInterface,
} from "../../shared/interfaces";

import { jsonResponse } from "../../shared/utils/jsonResponse.utils";
import { Model, Types } from "mongoose";
import { warningMessage, errorMessage } from "../../shared/messages";
import AppError from "../../shared/utils/AppError.utils";

export const getOne = <
  T extends UserInterface | ApiKeyInterface | NotificationInterface
>(
  Model: Model<T>
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = new Types.ObjectId(req.params.id);

    const doc: T = await Model.findOne(id).lean();

    if (!doc) {
      return next(
        new AppError(
          404,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("document"),
          {
            request: errorMessage.ERROR_NO_SEARCH_RESULTS,
          }
        )
      );
    }
    res.status(200).json(
      jsonResponse({
        data: doc,
      })
    );
  });


