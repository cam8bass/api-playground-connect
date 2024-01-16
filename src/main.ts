import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import userRouter from "./routes/user.routes";
import apiKeyRouter from "./routes/apiKey.routes";
import adminRouter from "./routes/admin.routes";
import notificationRouter from "./routes/notification.routes";
import errorController from "./controllers/error.controller";
import dotenv from "dotenv";
import AppError from "./shared/utils/AppError.utils";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import { rateLimit } from "express-rate-limit";
import { nodeEnv } from "./shared/types/types";
import cors from "cors";
import { errorMessage, warningMessage } from "./shared/messages";

dotenv.config({ path: "./config.env" });
const nodeEnv = process.env.NODE_ENV as nodeEnv;

const app = express();

// 1) MIDDLEWARE
app.use(helmet());
app.use(cors({ origin: ["http://localhost:5173"], credentials: true })); // FIXME: A modifier pour la production

// app.use(
//   rateLimit({
//     max: 100,
//     windowMs: 1000 * 60 * 60,
//     handler: (req, res, next) => {
//       next(
//         new AppError(429, errorMessage.ERROR_RATE_LIMIT, {
//           request: errorMessage.ERROR_RATE_LIMIT,
//         })
//       );
//     },
//   })
// );

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize());

if (nodeEnv === "development") {
  app.use(morgan("dev"));
}

// 2) ROUTES
app.use("/playground-connect/v1/users", userRouter);
app.use("/playground-connect/v1/apiKeys", apiKeyRouter);
app.use("/playground-connect/v1/admin", adminRouter);
app.use("/playground-connect/v1/notification", notificationRouter);
app.use("*", (req: Request, res: Response, next: NextFunction) => {
  return next(
    new AppError(404, warningMessage.WARNING_PAGE_NOT_FOUND, {
      app: errorMessage.ERROR_PAGE_NOT_FOUND,
    })
  );
});
// ERRORS
app.use(errorController);
export default app;
