import { config } from "dotenv";
import connectDB from "./mongodb";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  console.log("⏳ Connecting to MongoDB and ensuring collections...");

  const start = Date.now();

  try {
    // Connect to MongoDB - this will create collections automatically when documents are inserted
    await connectDB();
    const end = Date.now();

    console.log("✅ MongoDB connection established in", end - start, "ms");
    console.log(
      "📝 Collections will be created automatically when documents are inserted"
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed");
    console.error(error);
    process.exit(1);
  }
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
