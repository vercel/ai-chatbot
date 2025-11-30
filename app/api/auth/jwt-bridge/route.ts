import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

/**
 * JWT Bridge Endpoint
 * Converts NextAuth session to JWT token for FastAPI backend
 *
 * This endpoint:
 * 1. Gets the current NextAuth session
 * 2. Generates a JWT token with the same format expected by FastAPI
 * 3. Sets the token as an httpOnly cookie (secure, not accessible to JavaScript)
 * 4. Returns success response
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

  // Create response with token (for cross-origin requests to FastAPI)
  // Also set httpOnly cookie (for same-origin requests)
  const response = NextResponse.json({
    success: true,
    access_token: token, // Include token for cross-origin use
  });

  // Set httpOnly cookie (secure, not accessible to JavaScript)
  // This works for same-origin requests (Next.js API routes)
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set("auth_token", token, {
    httpOnly: true, // Not accessible to JavaScript (XSS protection)
    secure: isProduction, // Only send over HTTPS in production
    sameSite: "lax", // CSRF protection
    maxAge: 30 * 60, // 30 minutes (matches token expiration)
    path: "/", // Available for all paths
  });

  return response;
}
