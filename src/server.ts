import dotenv from "dotenv";
import app from "./main";
import connectToDB from "./shared/services/connectDb.service";
import http from "http";
import { nodeEnv } from "./shared/types/types";

let server: http.Server;
dotenv.config({ path: "./config.env" });

const nodeEnv = process.env.NODE_ENV as nodeEnv;

const { DATABASE, DATABASE_PASSWORD, PORT } = process.env;

const databaseUri = DATABASE?.replace("<password>", DATABASE_PASSWORD!);

async function startServer() {
  await connectToDB(databaseUri!);
  const port = PORT || 3000;
  server = app.listen(port, () => {
    console.log(`✅ Server is listening on port ${port}`);
  });

  server.on("error", (error: any) => {
    if (nodeEnv === "development") {
      console.error("💥 Server startup error:", error);
    } else if (nodeEnv === "production") {
      console.error("💥 Server startup error:", error.name, error.message);
    }

    server.close(() => {
      process.exit(1);
    });
  });
}

startServer();
