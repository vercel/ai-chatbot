import { config } from "dotenv";
import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

config({
  path: ".env.local",
});

const runReset = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  const sql = postgres(process.env.POSTGRES_URL, { 
    max: 1,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("⏳ Resetting database...");
    const start = Date.now();

    // Read and execute the reset SQL file
    const resetSQL = readFileSync(join(__dirname, "reset.sql"), "utf-8");
    await sql.unsafe(resetSQL);

    const end = Date.now();
    console.log("✅ Database reset completed in", end - start, "ms");
  } catch (error) {
    console.error("❌ Database reset failed");
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
};

runReset(); 