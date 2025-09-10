import "server-only";

import { default as SQLiteDatabase } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

// Initialize SQLite database
const sqlite = new SQLiteDatabase("./lib/db/sqlite.db");
const db = drizzle(sqlite);

export { db, sqlite };
