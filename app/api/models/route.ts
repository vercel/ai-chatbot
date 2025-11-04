/** biome-ignore-all lint/style/useConsistentObjectDefinitions: <explanation> */
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getCachedAvailableModels, refreshModelCache } from "@/lib/ai/model-fetcher";

export function GET() {
  try {
  try { refreshModelCache(); } catch {}
  const models = getCachedAvailableModels();
  const hasStabilityKey = !!(process.env.STABILITY_API_KEY || (process.env as any).STABILITY_KEY || (process.env as any).STABILITYAI_API_KEY);
    const hasGoogleKey = !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY);
    const hasHfToken = !!process.env.HF_TOKEN;

    return NextResponse.json({
      models: models,
      timestamp: Date.now(),
      env: {
        hasStabilityKey,
        hasGoogleKey,
        hasHfToken,
      },
    });
  } catch (error) {
    console.error("Failed to fetch models:", error);

    // Return fallback models
    const fallbackModels = [
      {
        id: "mistral-large-latest",
        name: "Mistral Large",
        description:
          "Advanced large language model with superior reasoning capabilities",
        provider: "mistral",
      },
      {
        id: "mistral-small-latest",
        name: "Mistral Small",
        description: "Fast and efficient model for simple tasks",
        provider: "mistral",
      },
    ];

    return NextResponse.json({
      models: fallbackModels,
      timestamp: Date.now(),
      error: "Failed to fetch from providers, using fallback models",
    });
  }
}
