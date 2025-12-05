import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 60;

/**
 * Ghost Mode API Route
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
 *   "result": "AI evaluation response",
 *   "timestamp": "2024-12-05T10:00:00.000Z",
 *   "model": "chat-model"
 * }
 */

export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Import AI SDK dynamically to avoid edge runtime issues
    const { generateText } = await import("ai");
    const { myProvider } = await import("@/lib/ai/providers");

    // Build the full prompt with context if provided
    const fullPrompt = context 
      ? `${prompt}\n\nContext: ${JSON.stringify(context)}`
      : prompt;

    // Generate response using the specified model
    const result = await generateText({
      model: myProvider.languageModel(model),
      prompt: fullPrompt,
    });

    // Return the evaluation result
    return NextResponse.json({
      result: result.text,
      timestamp: new Date().toISOString(),
      model,
    });

  } catch (error) {
    console.error("Ghost Mode API Error:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "ghost-mode",
    version: "0.1.0",
  });
}
