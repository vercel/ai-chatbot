import { config } from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

config({
	path: ".env.local",
});

const runMigrate = async () => {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not defined");
	}

	const connection = await mysql.createPool({
		uri: process.env.DATABASE_URL,
	});
	const db = drizzle(connection);

	console.log("⏳ Running migrations...");

	const start = Date.now();
	await migrate(db, { migrationsFolder: "./lib/drizzle" });
	const end = Date.now();

	console.log("✅ Migrations completed in", end - start, "ms");
	process.exit(0);
};

runMigrate().catch((err) => {
	console.error("❌ Migration failed");
	console.error(err);
	process.exit(1);
});
