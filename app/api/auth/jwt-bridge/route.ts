import { auth } from "@/app/(auth)/auth";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * JWT Bridge Endpoint
 * Converts NextAuth session to JWT token for FastAPI backend
 *
 * This endpoint:
 * 1. Gets the current NextAuth session
 * 2. Generates a JWT token with the same format expected by FastAPI
 * 3. Returns the token for use in FastAPI requests
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Get JWT secret from environment (must match FastAPI JWT_SECRET_KEY)
  const jwtSecret = process.env.JWT_SECRET_KEY;
  if (!jwtSecret) {
    console.error("JWT_SECRET_KEY is not set in environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Generate JWT token matching FastAPI format
  // FastAPI expects: { sub: user_id, type: user_type, exp: expiration }
  const token = jwt.sign(
    {
      sub: session.user.id,
      type: session.user.type || "regular",
    },
    jwtSecret,
    {
      expiresIn: "30m", // Match FastAPI JWT_ACCESS_TOKEN_EXPIRE_MINUTES (default: 30)
      algorithm: "HS256", // Match FastAPI JWT_ALGORITHM
    }
  );

  return NextResponse.json({ access_token: token });
}

