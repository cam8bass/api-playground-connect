import dotenv from "dotenv";
import app from "./main";
import connectToDB from "./shared/services/connectDb.service";

dotenv.config({ path: "./config.env" });

const { DATABASE, DATABASE_PASSWORD, PORT } = process.env;

const databaseUri = DATABASE?.replace("<password>", DATABASE_PASSWORD!);

async function startServer() {
  try {
    await connectToDB(databaseUri!);
    const port = PORT || 3000;
    app.listen(port, () => {
      console.log(`✅ Server is listening on port ${port}`);
    });
  } catch (error) {
    console.error("💥 Server startup error:", error);
  }
}

startServer();
