/**
 * Text-to-Speech (TTS) API Route
 *
 * **Endpoint**: POST /api/voice/synthesize
 *
 * **Purpose**: Converts text to natural-sounding speech audio using Cartesia's Sonic TTS model.
 * Returns streaming PCM audio data that can be played directly via the Web Audio API.
 *
 * **Used By**:
 * - `components/message-actions.tsx` - Speaker button on assistant messages
 * - `hooks/use-player.ts` - Audio playback hook consumes the stream
 *
 * **Integration**:
 * This endpoint is called when a user clicks the speaker button on an assistant message
 * (when TTS is enabled). The returned audio stream is passed to the usePlayer hook which
 * uses the Web Audio API to play the synthesized speech in real-time.
 *
 * **Request Body**:
 * ```json
 * {
 *   "text": "Hello world", // Required: Text to synthesize
 *   "voiceId": "79a125e8-cd45-4c13-8a67-188112f4dd22" // Optional: Cartesia voice ID
 * }
 * ```
 *
 * **Response**:
 * - Success: Streaming audio/raw response with PCM_F32LE audio data
 * - Error 400: No text provided
 * - Error 500: CARTESIA_API_KEY not configured or synthesis failed
 *
 * **Audio Format**:
 * - Container: Raw (no container, pure audio data)
 * - Encoding: PCM_F32LE (32-bit float, little-endian)
 * - Sample Rate: 24,000 Hz
 * - Channels: 1 (mono)
 *
 * **Cartesia Sonic Model**:
 * - Model: sonic-english
 * - Provider: Cartesia AI (https://cartesia.ai)
 * - Features: Low-latency streaming, natural prosody, emotional expression
 * - Latency: ~200-500ms to first audio byte
 *
 * **Environment Variables Required**:
 * - CARTESIA_API_KEY: Get from https://cartesia.ai
 *
 * **Flow**:
 * 1. Client sends POST with text to synthesize
 * 2. Server validates text and API key
 * 3. Calls Cartesia TTS API with text and voice settings
 * 4. Streams raw PCM audio back to client
 * 5. Client's usePlayer hook decodes and plays via AudioContext
 *
 * **Voice ID**: Default voice is a natural-sounding English voice.
 * Browse available voices at: https://docs.cartesia.ai/api-reference/tts/voices
 *
 * @param request - Next.js request object containing JSON body with text and optional voiceId
 * @returns Streaming Response with raw PCM audio data or JSON error
 *
 * @example
 * ```typescript
 * // Client-side usage (from message-actions.tsx):
 * const response = await fetch("/api/voice/synthesize", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({ text: "Hello world" }),
 * });
 *
 * if (response.ok && response.body) {
 *   player.play(response.body, () => console.log("Playback complete"));
 * }
 * ```
 *
 * @see hooks/use-player.ts - Audio playback consumer
 * @see components/message-actions.tsx - UI trigger for TTS
 * @see https://docs.cartesia.ai/api-reference/tts/bytes - Cartesia API docs
 */
import { NextResponse } from "next/server";

/**
 * POST handler for text-to-speech synthesis.
 *
 * Accepts text input and returns streaming PCM audio from Cartesia Sonic.
 */
export async function POST(request: Request) {
  try {
    const { text, voiceId } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (!process.env.CARTESIA_API_KEY) {
      return NextResponse.json(
        { error: "CARTESIA_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "Cartesia-Version": "2024-06-30",
        "Content-Type": "application/json",
        "X-API-Key": process.env.CARTESIA_API_KEY,
      },
      body: JSON.stringify({
        model_id: "sonic-english",
        transcript: text,
        voice: {
          mode: "id",
          id: voiceId || "79a125e8-cd45-4c13-8a67-188112f4dd22", // Default voice
        },
        output_format: {
          container: "raw",
          encoding: "pcm_f32le",
          sample_rate: 24_000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Cartesia API error:", error);
      return NextResponse.json(
        { error: "Voice synthesis failed" },
        { status: 500 }
      );
    }

    // Return the streaming audio response
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/raw",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "Voice synthesis failed" },
      { status: 500 }
    );
  }
}
