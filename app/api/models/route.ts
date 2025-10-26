/** biome-ignore-all lint/style/useConsistentObjectDefinitions: <explanation> */
import { NextResponse } from "next/server";
import { getCachedAvailableModels } from "@/lib/ai/model-fetcher";

export function GET() {
  try {
    const models = getCachedAvailableModels();

    return NextResponse.json({
      models: models,
      timestamp: Date.now(),
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
