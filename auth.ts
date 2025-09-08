import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./lib/db/client";
import { nextCookies } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { anonymous } from "better-auth/plugins";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    appName: "ai-chatbot",
    plugins: [anonymous(), nextCookies()],
});
