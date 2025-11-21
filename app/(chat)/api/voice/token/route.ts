/**
 * Cartesia Access Token Generation API Route
 *
 * **Endpoint**: POST /api/voice/token
 *
 * **Purpose**: Generates short-lived Cartesia access tokens for client-side TTS.
 * Allows secure client-side streaming without exposing the API key.
 *
 * **Used By**:
 * - Voice Agent mode in `components/chat.tsx`
 * - Client-side TTS streaming for low-latency audio playback
 *
 * **Security**:
 * - Tokens expire in 60 seconds
 * - Only TTS grant is provided
 * - API key remains secure on server
 *
 * **Response**:
 * ```json
 * {
 *   "token": "temporary_access_token_here",
 *   "expiresIn": 60
 * }
 * ```
 *
 * **Error Responses**:
 * - 500: CARTESIA_API_KEY not configured or token generation failed
 *
 * @see https://docs.cartesia.ai/get-started/authenticate-your-client-applications
 */
import { NextResponse } from "next/server";

export async function POST() {
  try {
    if (!process.env.CARTESIA_API_KEY) {
      return NextResponse.json(
        { error: "CARTESIA_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.cartesia.ai/access-token", {
      method: "POST",
      headers: {
        "Cartesia-Version": "2024-06-30",
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CARTESIA_API_KEY}`,
      },
      body: JSON.stringify({
        grants: { tts: true },
        expires_in: 60, // 60 seconds
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Cartesia token generation error:", error);
      return NextResponse.json(
        { error: "Token generation failed" },
        { status: 500 }
      );
    }

    const data = await response.json();

    console.log("Cartesia token API response received");
    console.log("- Token field:", data.token ? "present" : "MISSING");
    console.log("- Token length:", data.token?.length || 0);

    if (!data.token) {
      console.error("Cartesia API returned no token:", data);
      return NextResponse.json(
        { error: "Token generation failed - no token in response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: data.token, // Cartesia returns "token" not "access_token"
      expiresIn: 60,
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Token generation failed" },
      { status: 500 }
    );
  }
}
