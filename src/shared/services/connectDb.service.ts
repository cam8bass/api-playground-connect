import mongoose from "mongoose";
import { nodeEnv } from "../types/types";
import client from "../../infisical";

/**
 * @description Connects to the MongoDB database using the provided connection string and options.
 */
async function connectToDB(): Promise<void> {
  try {
    const { secretValue: DATABASE } = await client.getSecret("DATABASE");

    const { secretValue: DATABASE_PASSWORD } = await client.getSecret(
      "DATABASE_PASSWORD"
    );

    const { secretValue: DATABASE_NAME } = await client.getSecret(
      "DATABASE_NAME"
    );

    const databaseUri = DATABASE?.replace("<password>", DATABASE_PASSWORD!);

    await mongoose.connect(databaseUri, {
      dbName: DATABASE_NAME,
      authMechanism: "SCRAM-SHA-256",
      tls: true,
      maxPoolSize: 50,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      serverSelectionTimeoutMS: 5000,
      autoIndex: false,
      compressors: ["zlib"],
    });

    console.log("✅ Database connected");
  } catch (error) {
    const nodeEnv = process.env.NODE_ENV as nodeEnv;

    if (nodeEnv === "development") {
      console.error("💥 Database connection error:", error);
    } else if (nodeEnv === "production") {
      console.error("💥 Database connection error:", error.name, error.message);
    }
    process.exit(1);
  }
}

export default connectToDB;
