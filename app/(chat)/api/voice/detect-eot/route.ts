/**
 * End of Turn (EOT) Detection API Route
 *
 * **Endpoint**: POST /api/voice/detect-eot
 *
 * **Purpose**: Determines if a user has finished speaking or is just pausing.
 * Uses the Python nlp-worker's EOT endpoint which runs the livekit/turn-detector model.
 *
 * **Optional Service**: This endpoint gracefully falls back to simple heuristics
 * when the NLP Worker service is not available. The app will continue to function
 * normally without the service.
 *
 * **Request Body**:
 * ```json
 * {
 *   "chatHistory": [
 *     { "role": "user", "content": "Hello" },
 *     { "role": "assistant", "content": "Hi there!" },
 *     { "role": "user", "content": "Can you help me with" }
 *   ]
 * }
 * ```
 *
 * **Response**:
 * ```json
 * {
 *   "eou_probability": 0.042,
 *   "unlikely_threshold": 0.15,
 *   "is_end_of_utterance": false,
 *   "_fallback": false  // true if using heuristics instead of ML model
 * }
 * ```
 *
 * **Fallback Behavior**:
 * When NLP Worker is unavailable, uses simple heuristics:
 * - Checks for ending punctuation (., !, ?)
 * - Requires minimum word count (3+ words)
 * - Works well for complete sentences
 *
 * **Integration with VAD**:
 * Call this after VAD detects silence and transcription completes.
 * Use `is_end_of_utterance` to decide whether to send message or keep listening.
 *
 * **Environment Variables (Optional)**:
 * - NLP_WORKER_URL: URL of nlp-worker (default: http://localhost:8097)
 * - NLP_WORKER_API_KEY: API key for authentication
 *
 * @see lib/nlp-worker-client.ts - Client implementation
 * @see hooks/use-voice-input.ts - VAD integration example
 * @see VOICE_FEATURES.md - Setup and architecture documentation
 */

import { NextResponse } from "next/server";
import type { EOTChatMessage } from "@/lib/nlp-worker-client";
import { nlpWorkerClient } from "@/lib/nlp-worker-client";

const DEBUG = process.env.DEBUG === "true";
const END_PUNCTUATION_REGEX = /[.!?]$/;
const WORD_COUNT_REGEX = /\s+/;

/**
 * Fallback EOT detection using simple heuristics
 *
 * This provides basic but effective end-of-turn detection when the
 * NLP Worker service is unavailable.
 *
 * @param transcript - The user's current utterance
 * @returns EOT response with heuristic-based decision
 */
function fallbackEOTDetection(transcript: string) {
  const trimmed = transcript.trim();

  // Check for ending punctuation
  const hasEndPunctuation = END_PUNCTUATION_REGEX.test(trimmed);

  // Count words
  const wordCount = trimmed
    .split(WORD_COUNT_REGEX)
    .filter((word) => word.length > 0).length;

  // Simple but effective rules:
  // 1. Must end with punctuation
  // 2. Must have at least 3 words (avoid "Yes." or "Ok.")
  const isComplete = hasEndPunctuation && wordCount >= 3;

  // Calculate a simple "probability" based on heuristics
  let probability = 0.0;

  if (hasEndPunctuation) {
    probability += 0.5;
  }
  if (wordCount >= 3) {
    probability += 0.3;
  }
  if (wordCount >= 5) {
    probability += 0.2;
  }

  return {
    eou_probability: probability,
    unlikely_threshold: 0.15,
    is_end_of_utterance: isComplete,
    _fallback: true,
    _method: "heuristic",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chatHistory } = body as { chatHistory: EOTChatMessage[] };

    // Validate input
    if (!chatHistory || !Array.isArray(chatHistory)) {
      return NextResponse.json(
        { error: "chatHistory must be an array" },
        { status: 400 }
      );
    }

    if (chatHistory.length === 0) {
      return NextResponse.json(
        { error: "chatHistory must contain at least one message" },
        { status: 400 }
      );
    }

    // Extract the current utterance for fallback
    const lastMessage = chatHistory.at(-1);
    const currentUtterance = lastMessage?.content || "";

    // Try NLP Worker first if configured
    if (nlpWorkerClient.isConfigured()) {
      const result = await nlpWorkerClient.detectEOT(chatHistory);

      // If successful, return the result
      if (!("error" in result)) {
        return NextResponse.json({
          ...result,
          _fallback: false,
          _method: "ml_model",
        });
      }

      if (DEBUG) {
        console.log(
          "[EOT] NLP Worker unavailable, using fallback:",
          result.error
        );
      }
    }

    // Use fallback heuristics
    const fallbackResult = fallbackEOTDetection(currentUtterance);

    return NextResponse.json(fallbackResult, { status: 200 });
  } catch (error) {
    console.error("[EOT] Unexpected API error:", error);

    // Even in case of unexpected errors, try to provide a reasonable fallback
    return NextResponse.json(
      {
        eou_probability: 0.5,
        unlikely_threshold: 0.15,
        is_end_of_utterance: true,
        _fallback: true,
        _method: "error_fallback",
        _error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}
