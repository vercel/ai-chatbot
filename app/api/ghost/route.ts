import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const maxDuration = 60;

// Regex patterns for parsing evaluation responses
const SCORE_REGEX = /Score:\s*(\d+)/i;
const FEEDBACK_REGEX = /Feedback:\s*(.+?)(?:\n|$)/i;

/**
 * Ghost Mode API Route (DEPRECATED)
 *
 * ⚠️ **DEPRECATED:** This endpoint is deprecated in favor of AgentOS v1.0.
 *
 * **Migration Path:**
 * Please use `/api/agent-router` instead with the canonical task format.
 * See docs/AGENTOS_V1_OVERVIEW.md for the "TiQology Global Contract" section.
 *
 * **Legacy Support:**
 * This endpoint remains functional for backward compatibility but will be removed in v2.0.
 * All new integrations should use AgentOS.
 *
 * ---
 *
 * This endpoint allows TiQology-spa to send prompts for AI evaluation
 * without creating a persistent chat or requiring user authentication.
 *
 * Use case: Quick AI evaluations for form validation, content analysis, etc.
 *
 * Request body:
 * {
 *   "prompt": "Evaluate this user input...",
 *   "context"?: {...},  // Optional additional context
 *   "model"?: "chat-model" | "chat-model-reasoning"
 * }
 *
 * Response:
 * {
 *   "score": 85,
 *   "feedback": "AI evaluation feedback",
 *   "result": "Full AI response text",
 *   "timestamp": "2024-12-05T10:00:00.000Z",
 *   "model": "chat-model"
 * }
 */

export async function POST(req: NextRequest) {
  try {
    // Add deprecation warning header
    const response = await handleGhostRequest(req);
    response.headers.set("X-Deprecated", "true");
    response.headers.set(
      "X-Deprecation-Message",
      "Use /api/agent-router instead. See docs/AGENTOS_V1_OVERVIEW.md"
    );
    response.headers.set(
      "X-Migration-Guide",
      "https://github.com/MrAllgoodWilson/ai-chatbot/blob/main/docs/AGENTOS_V1_OVERVIEW.md#tiqology-global-contract"
    );
    return response;
  } catch (error) {
    console.error("Ghost Mode API Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleGhostRequest(req: NextRequest) {
  // Parse request body
  const body = await req.json();
  const { prompt, context, model = "chat-model" } = body;

  // Validate required fields
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'prompt' field" },
      { status: 400 }
    );
  }

  // Optional: Validate API key from TiQology-spa
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = process.env.GHOST_MODE_API_KEY;

  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Import AI SDK dynamically to avoid edge runtime issues
  const { generateText } = await import("ai");
  const { myProvider } = await import("@/lib/ai/providers");

  // Build evaluation prompt that requests structured output
  const evaluationPrompt = `Evaluate the following and provide:
1. A quality/confidence score from 0-100
2. Brief feedback (1-2 sentences)

${prompt}${context ? `\n\nContext: ${JSON.stringify(context)}` : ""}

Format your response as:
Score: [0-100]
Feedback: [your feedback]`;

  // Generate response using the specified model
  const result = await generateText({
    model: myProvider.languageModel(model),
    prompt: evaluationPrompt,
  });

  // Parse score and feedback from response
  const responseText = result.text;
  const scoreMatch = responseText.match(SCORE_REGEX);
  const feedbackMatch = responseText.match(FEEDBACK_REGEX);

  const score = scoreMatch
    ? Math.min(100, Math.max(0, Number.parseInt(scoreMatch[1], 10)))
    : 50;
  const feedback = feedbackMatch
    ? feedbackMatch[1].trim()
    : responseText.split("\n")[0];

  // Return the evaluation result with score and feedback
  return NextResponse.json({
    score,
    feedback,
    result: responseText,
    timestamp: new Date().toISOString(),
    model,
  });
}

// Health check endpoint
export function GET() {
  return NextResponse.json({
    status: "deprecated",
    service: "ghost-mode",
    version: "0.1.0",
    deprecationNotice: {
      message: "This endpoint is deprecated. Please migrate to AgentOS v1.0",
      migrationEndpoint: "/api/agent-router",
      documentationUrl:
        "https://github.com/MrAllgoodWilson/ai-chatbot/blob/main/docs/AGENTOS_V1_OVERVIEW.md#tiqology-global-contract",
      removalDate: "2026-03-01",
    },
  });
}
