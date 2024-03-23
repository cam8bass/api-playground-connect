import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import userRouter from "./routes/user.routes";
import apiKeyRouter from "./routes/apiKey.routes";
import adminRouter from "./routes/admin.routes";
import notificationRouter from "./routes/notification.routes";
import errorController from "./controllers/error.controller";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import { rateLimit } from "express-rate-limit";
import { nodeEnvType } from "./shared/types/types";
import cors from "cors";
import { errorMessage } from "./shared/messages";
import { AppError } from "./shared/utils";

dotenv.config({ path: "./config.env" });
const nodeEnv = process.env.NODE_ENV as nodeEnvType;

const app = express();

// 1) MIDDLEWARE
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.1.40:5173"],
    credentials: true,
  })
); // FIXME: A modifier pour la production

// app.use(
//   rateLimit({
//     max: 100,
//     windowMs: 1000 * 60 * 60,
//     handler: (req, res, next) => {
//       next(
//         new AppError(req, {
//           statusCode: 429,
//           message: errorMessage.ERROR_RATE_LIMIT,
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
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(
    new AppError(req, {
      statusCode: 404,
      message: errorMessage.ERROR_PAGE_NOT_FOUND,
    })
  );
});

// ERRORS
app.use(errorController);
export default app;
