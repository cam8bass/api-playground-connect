import express from "express";
import morgan from "morgan";
import userRouter from "./routes/user.routes";

const app = express();

// 1) MIDDLEWARE
app.use(express.json());
app.use(morgan("dev"));
// 2) ROUTES
app.use("/playground-connect/v1/users", userRouter);
// ERRORS
export default app;
