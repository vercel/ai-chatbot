import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({
	path: ".env.local",
});

export default defineConfig({
	schema: "./db/schema.ts",
	out: "./lib/drizzle",
	dialect: "mysql",
	dbCredentials: {
		url: process.env.DATABASE_URL as string,
	},
});
