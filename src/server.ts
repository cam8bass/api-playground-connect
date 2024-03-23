import app from "./main";
import connectToDB from "./shared/services/connectDb.service";
import http from "http";
import {  nodeEnvType } from "./shared/types/types";

/**
 * Starts the server.
 */
async function startServer() {
  let server: http.Server;

  const nodeEnv = process.env.NODE_ENV as nodeEnvType;

  const { PORT } = process.env;

  await connectToDB();

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
