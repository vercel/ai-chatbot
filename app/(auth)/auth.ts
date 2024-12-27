import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserByBubbleId, createUserWithBubbleId } from "@/lib/db/queries";
import { authConfig } from "./auth.config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "bubble",
      name: "Bubble",
      // Define a simple credential structure
      credentials: {
        bubbleUserId: { type: "text" },
      },
      // Simplified authorize function
      async authorize(credentials) {
        console.log("=== START OF BUBBLE AUTH ===");
        console.log("Received credentials:", credentials);

        const bubbleUserId = credentials?.bubbleUserId;
        if (!bubbleUserId) {
          console.log("No bubbleUserId provided");
          return null;
        }

        try {
          // Call Bubble API
          const response = await fetch(
            "https://app.tryrosedale.com/version-test/api/1.1/wf/get_user",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.BUBBLE_ADMIN_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId: bubbleUserId }),
            }
          );

          if (!response.ok) {
            console.error("Bubble API error:", response.status);
            return null;
          }

          const data = await response.json();
          const bubbleEmail = data?.response?.email;

          if (!bubbleEmail) {
            console.error("No email found in Bubble response");
            return null;
          }
          // Find or create user
          let user = await getUserByBubbleId(bubbleUserId as string);

          if (!user) {
            user = await createUserWithBubbleId(
              bubbleUserId as string,
              bubbleEmail as string
            );
          }

          return {
            id: user.id,
            email: user.email,
            bubbleUserId: bubbleUserId,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
