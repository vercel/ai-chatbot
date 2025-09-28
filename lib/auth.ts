import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db"
import { user } from "./db/schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: user,
    }
  }),
  user: {
    additionalFields: {
      type: {
        type: "string",
        input: false,
        defaultValue: "regular"
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Custom password verification to maintain existing bcrypt logic
    password: {
      hash: async (password) => {
        const bcrypt = await import("bcrypt-ts")
        return bcrypt.hash(password, 10)
      },
      verify: async ({ password, hash }) => {
        const bcrypt = await import("bcrypt-ts")
        return bcrypt.compare(password, hash)
      }
    }
  },
  // Note: Guest user system will be handled through custom API routes
  // BetterAuth doesn't have built-in "guest" provider like NextAuth
})

export type Session = typeof auth.$Infer.Session
export type UserType = "guest" | "regular"