"use server";

import { GoogleAICacheManager } from "@google/generative-ai/server";
import { regularPrompt } from "./prompts";

const CACHE_TTL_SECONDS = 300; // 5 minutes

let cacheManager: GoogleAICacheManager | null = null;

function getCacheManager(): GoogleAICacheManager {
  if (!cacheManager) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }
    cacheManager = new GoogleAICacheManager(apiKey);
  }
  return cacheManager;
}

let cachedContentId: string | null = null;
let cacheExpiry: number | null = null;

export async function getCachedTranslationPrompt(
  model: string
): Promise<string | null> {
  try {
    const now = Date.now();

    // Check if we have a valid cached content ID
    if (cachedContentId && cacheExpiry && now < cacheExpiry) {
      return cachedContentId;
    }

    // Create or recreate cache
    const manager = getCacheManager();
    const { name } = await manager.create({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: regularPrompt }],
        },
      ],
      ttlSeconds: CACHE_TTL_SECONDS,
    });

    cachedContentId = name ?? null;
    cacheExpiry = now + CACHE_TTL_SECONDS * 1000;

    return name ?? null;
  } catch (error) {
    console.error("Failed to create cache for translation prompt:", error);
    // Return null if caching fails - we'll proceed without cache
    return null;
  }
}
