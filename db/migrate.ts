import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  // Use a separate connection for migrations
  const migrationClient = postgres(process.env.POSTGRES_URL, { 
    max: 1,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("⏳ Running migrations...");

    const db = drizzle(migrationClient);
    const start = Date.now();

    await migrate(db, { 
      migrationsFolder: "./lib/drizzle",
      migrationsTable: "drizzle_migrations"
    });

    const end = Date.now();
    console.log("✅ Migrations completed in", end - start, "ms");

  } catch (error) {
    console.error("❌ Migration failed");
    console.error(error);
    process.exit(1);
  } finally {
    await migrationClient.end();
    process.exit(0);
  }
};

runMigrate();
