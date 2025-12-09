/**
 * TiQology Elite Inference API
 *
 * High-performance AI inference with intelligent model routing
 */

import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  generateInference,
  generateInferenceStream,
  getCostAnalytics,
  type InferenceRequest,
} from "@/lib/ai/eliteInference";
import { eliteMiddleware } from "@/lib/eliteMiddleware";

export const runtime = "edge";

async function handleInferenceRequest(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Please sign in to use AI inference" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const request: InferenceRequest = {
    prompt: body.prompt,
    systemPrompt: body.systemPrompt,
    tier: body.tier || "balanced",
    maxTokens: body.maxTokens,
    temperature: body.temperature,
    userId: session.user.id,
    stream: body.stream || false,
  };

  // Validate
  if (!request.prompt) {
    return NextResponse.json(
      { error: "Bad Request", message: "Prompt is required" },
      { status: 400 }
    );
  }

  // Handle streaming
  if (request.stream) {
    const stream = await generateInferenceStream(request);

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Handle regular inference
  const response = await generateInference(request);

  return NextResponse.json(response, { status: 200 });
}

export async function POST(req: NextRequest) {
  return eliteMiddleware(req, handleInferenceRequest);
}

// Get cost analytics (admin only)
export async function GET(req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Admin access required" },
      { status: 403 }
    );
  }

  const analytics = getCostAnalytics();

  return NextResponse.json(analytics, { status: 200 });
}
