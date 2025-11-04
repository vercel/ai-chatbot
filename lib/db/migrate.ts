import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    console.log("⚠️  POSTGRES_URL is not defined. Skipping migrations (using in-memory fallback).");
    console.log("   To enable persistent storage, set POSTGRES_URL in your Vercel environment variables.");
    process.exit(0);
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log("⏳ Running migrations...");

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");
  process.exit(0);
};

runMigrate().catch((err: any) => {
  const codes: string[] = [
    err?.code,
    ...(Array.isArray(err?.errors) ? err.errors.map((e: any) => e?.code) : []),
  ].filter(Boolean);

  if (codes.includes("ECONNREFUSED")) {
    console.log("⚠️  Database unreachable. Skipping migrations (using in-memory fallback).");
    process.exit(0);
    return;
  }

  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
