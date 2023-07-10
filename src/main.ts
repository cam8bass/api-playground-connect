import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import userRouter from "./routes/user.routes";
import apiKeyRouter from "./routes/apiKey.routes";
import adminRouter from "./routes/admin.routes";
import errorController from "./controllers/error.controller";
import dotenv from "dotenv";
import AppError from "./shared/utils/AppError.utils";
import { AppMessage } from "./shared/messages";
import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import { rateLimit } from "express-rate-limit";
import { nodeEnv } from "./shared/types/types";

dotenv.config({ path: "./config.env" });
const nodeEnv = process.env.NODE_ENV as nodeEnv;

const app = express();

// 1) MIDDLEWARE
app.use(helmet());
app.use(
  rateLimit({
    max: 100,
    message:
      "Vous avez atteint le nombre maximal de requêtes autorisées. Veuillez réessayer ultérieurement.",
    windowMs: 1000 * 60 * 60,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize());

if (nodeEnv === "development") {
  app.use(morgan("dev"));
}

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
