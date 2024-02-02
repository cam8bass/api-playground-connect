import { NextFunction, Request, Response } from "express";
import { Model } from "mongoose";
import { UserInterface, ApiKeyInterface, NotificationInterface } from "../../shared/interfaces";
import { catchAsync, FilterQuery, jsonResponse } from "../../shared/utils";

export const getAll = <
  T extends UserInterface | ApiKeyInterface | NotificationInterface
>(
  Model: Model<T>
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const query = new FilterQuery(Model.find(), req.query)
      .filter()
      .fields()
      .sort()
      .page()
      .search();

    const [doc, results] = await Promise.all([
      query.queryMethod.lean(),
      Model.countDocuments(query.queryMethod.getFilter()),
    ]);

    res.status(200).json(jsonResponse({ results, data: doc as T[] }));
  });


