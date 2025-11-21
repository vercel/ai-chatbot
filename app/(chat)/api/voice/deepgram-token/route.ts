/**
 * Deepgram Temporary Token Generation API Route
 *
 * **Endpoint**: POST /api/voice/deepgram-token
 *
 * **Purpose**: Generates short-lived JWT tokens for secure client-side
 * Deepgram API access without exposing permanent API keys.
 *
 * **Security**:
 * - Token TTL: 30 seconds (Deepgram default)
 * - Scopes: usage:write only (can't create keys, access billing, etc.)
 * - WebSocket connections stay open beyond token expiry
 * - Never exposes main API key to client
 *
 * **Response**:
 * ```json
 * {
 *   "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
 *   "expires_in": 30
 * }
 * ```
 *
 * **Usage in Frontend**:
 * ```typescript
 * const { token } = await fetch('/api/voice/deepgram-token', { method: 'POST' });
 * const deepgram = createClient(token);
 * const connection = deepgram.listen.live({ ... });
 * ```
 *
 * **Environment Variables**:
 * - DEEPGRAM_API_KEY: Main Deepgram API key (server-side only)
 *
 * @see hooks/use-deepgram-stream.ts - Frontend Deepgram connection
 * @see https://developers.deepgram.com/docs/token-based-authentication
 */

import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      console.error("Missing DEEPGRAM_API_KEY environment variable");
      return NextResponse.json(
        { error: "Deepgram API key not configured" },
        { status: 500 }
      );
    }

    // Generate temporary JWT token via /v1/auth/grant endpoint
    // This creates a 30-second token that allows usage:write access
    const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Deepgram token generation failed:", error);
      return NextResponse.json(
        { error: "Failed to generate token" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error("Deepgram token generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate token",
      },
      { status: 500 }
    );
  }
}
