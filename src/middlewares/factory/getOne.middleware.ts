import { NextFunction, Request, Response } from "express";
import { Model, Types } from "mongoose";
import { UserInterface, ApiKeyInterface, NotificationInterface } from "../../shared/interfaces";
import { warningMessage, errorMessage } from "../../shared/messages";
import { catchAsync, AppError, jsonResponse } from "../../shared/utils";


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


