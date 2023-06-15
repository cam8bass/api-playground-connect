import express from "express";
import morgan from "morgan";
import userRouter from "./routes/user.routes";
import errorController from "./controllers/error.controller";
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

const app = express();

// 1) MIDDLEWARE
app.use(express.json());
app.use(morgan("dev"));

// 2) ROUTES
app.use("/playground-connect/v1/users", userRouter);
// ERRORS
app.use(errorController);
export default app;
