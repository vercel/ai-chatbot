import type { LanguageModelUsage } from "ai";
import { unstable_cache as cache } from "next/cache";
import type { NextRequest } from "next/server";
import { fetchModels } from "tokenlens";
import type { ModelCatalog } from "tokenlens/core";
import { getUsage } from "tokenlens/helpers";
import { ChatSDKError } from "@/lib/errors";
import type { AppUsage } from "@/lib/usage";

const getTokenlensCatalog = cache(
  async (): Promise<ModelCatalog | undefined> => {
    try {
      return await fetchModels();
    } catch (err) {
      console.warn(
        "TokenLens: catalog fetch failed, using default catalog",
        err
      );
      return; // tokenlens helpers will fall back to defaultCatalog
    }
  },
  ["tokenlens-catalog"],
  { revalidate: 24 * 60 * 60 } // 24 hours
);

/**
 * TokenLens API endpoint for backend usage enrichment
 * Accepts usage data and model ID, returns enriched usage with cost information
 *
 * Returns the same structure as finalMergedUsage in the chat stream endpoints:
 * { ...usage, ...summary, modelId } where summary comes from getUsage()
 *
 * Usage from backend (Python/FastAPI):
 * ```python
 * import httpx
 *
 * async def enrich_usage(model_id: str, usage: dict):
 *     url = f"{settings.NEXTJS_URL}/api/tokenlens"
 *     headers = {
 *         "Content-Type": "application/json",
 *         "X-Internal-API-Secret": settings.INTERNAL_API_SECRET,
 *     }
 *     usage = {
 *         "inputTokens": 7159,
 *         "outputTokens": 85,
 *         "totalTokens": 7244,
 *         "reasoningTokens": 0,
 *         "cachedInputTokens": 4224,
 *     }
 *
 *     payload = {
 *         "modelId": model_id,
 *         "usage": usage
 *     }
 *
 *     async with httpx.AsyncClient() as client:
 *         response = await client.post(url, json=payload, headers=headers)
 *         return response.json()
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Check for internal API secret (from FastAPI)
    const internalSecret = request.headers.get("x-internal-api-secret");
    const expectedSecret = process.env.INTERNAL_API_SECRET;

    if (
      !internalSecret ||
      !expectedSecret ||
      internalSecret !== expectedSecret
    ) {
      return new ChatSDKError("unauthorized:api").toResponse();
    }

    const body = await request.json();
    const { modelId, usage }: { modelId: string; usage: LanguageModelUsage } =
      body;

    if (!modelId) {
      return new ChatSDKError(
        "bad_request:api",
        "modelId is required"
      ).toResponse();
    }

    if (!usage) {
      return new ChatSDKError(
        "bad_request:api",
        "usage is required"
      ).toResponse();
    }

    try {
      const providers = await getTokenlensCatalog();

      if (!providers) {
        // Return usage without enrichment if catalog fetch failed
        // Matches the pattern: finalMergedUsage = usage when providers is null
        const response: AppUsage = { ...usage, modelId };
        return Response.json(response);
      }

      // Match the exact pattern from chat stream endpoints:
      // const summary = getUsage({ modelId, usage, providers });
      // finalMergedUsage = { ...usage, ...summary, modelId } as AppUsage;
      const summary = getUsage({ modelId, usage, providers });
      const finalMergedUsage: AppUsage = { ...usage, ...summary, modelId };

      return Response.json(finalMergedUsage);
    } catch (err) {
      console.warn("TokenLens enrichment failed", err);
      // Return usage without enrichment on error
      // Matches the pattern: finalMergedUsage = usage on error
      const response: AppUsage = { ...usage, modelId };
      return Response.json(response);
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("Unhandled error in tokenlens API:", error);
    return new ChatSDKError("offline:api").toResponse();
  }
}
