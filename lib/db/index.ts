import 'server-only'; // Ensure this is only run on the server

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Ensure POSTGRES_URL is loaded, e.g., from .env.local
if (!process.env.POSTGRES_URL) {
  // In a real app, you might throw an error or have better logging.
  // For now, console.error is fine for development.
  console.error("POSTGRES_URL environment variable is not set.");
  // Potentially throw new Error("POSTGRES_URL environment variable is not set.");
  // Or handle it in a way that doesn't immediately crash if that's desired for some contexts.
}

// biome-ignore lint: Forbidden non-null assertion - we check above, but TS might not infer for client init.
// Consider a more robust check or default for client if POSTGRES_URL can truly be undefined at runtime.
const client = postgres(process.env.POSTGRES_URL || ""); // Provide a default empty string if it can be undefined
                                                        // or ensure it's always defined before this line.

export const db = drizzle(client);

// You can also export your schema objects from here if you want a single point of import for db and schema
// export * from './schema';
