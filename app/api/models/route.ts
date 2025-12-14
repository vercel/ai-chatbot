import { gateway } from "@ai-sdk/gateway";
import { unstable_cache as cache } from "next/cache";

const getAvailableModels = cache(
  async () => {
    const { models } = await gateway.getAvailableModels();
    // Filter to only language models
    const languageModels = models.filter((m) => m.modelType === "language");
    return { models: languageModels };
  },
  ["gateway-models"],
  { revalidate: 60 * 60 } // 1 hour
);

export async function GET() {
  try {
    const { models } = await getAvailableModels();
    return Response.json({ models });
  } catch (error) {
    console.error("Failed to fetch gateway models:", error);
    return Response.json(
      { models: [], error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}
