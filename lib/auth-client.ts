import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",
})

// Export commonly used functions
export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient