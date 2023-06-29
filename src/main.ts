import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import userRouter from "./routes/user.routes";
import apiKeyRouter from "./routes/apiKey.routes";
import adminRouter from "./routes/admin.routes";
import errorController from "./controllers/error.controller";
import dotenv from "dotenv";
import AppError from "./shared/utils/AppError.utils";
import { AppMessage } from "./shared/messages";

dotenv.config({ path: "./config.env" });

const app = express();

// 1) MIDDLEWARE
app.use(express.json());
app.use(morgan("dev"));

// 2) ROUTES
app.use("/playground-connect/v1/users", userRouter);
app.use("/playground-connect/v1/apiKeys", apiKeyRouter);
app.use("/playground-connect/v1/admin", adminRouter);
app.use("*", (req: Request, res: Response, next: NextFunction) => {
  return next(new AppError(AppMessage.errorMessage.ERROR_PAGE_NOT_FOUND, 404));
});
// ERRORS
app.use(errorController);
export default app;
