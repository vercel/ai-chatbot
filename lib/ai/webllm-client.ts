"use client";

import {
  doesBrowserSupportWebLLM,
  type WebLLMProgress,
  webLLM,
} from "@built-in-ai/web-llm";
import type { WebLLMQuality } from "./models";

export type WebLLMAvailability =
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available";

export type { WebLLMProgress };

export interface WebLLMOptions {
  quality?: WebLLMQuality;
  onProgress?: (progress: WebLLMProgress) => void;
}

/**
 * Map quality hints to specific WebLLM model IDs.
 * These models are selected based on size/capability trade-offs.
 */
const QUALITY_TO_MODEL_ID: Record<WebLLMQuality, string> = {
  draft: "Qwen3-0.6B-q4f16_1-MLC", // Smallest, fastest
  standard: "Llama-3.2-3B-Instruct-q4f16_1-MLC", // Balanced
  high: "Qwen3-4B-q4f16_1-MLC", // Better quality
  best: "Llama-3.1-8B-Instruct-q4f16_1-MLC", // Best quality, slower
};

/**
 * Create a WebLLM model based on quality hint.
 * Maps quality levels to appropriate model sizes.
 */
export function createWebLLMModel(options: WebLLMOptions = {}) {
  const { quality = "standard", onProgress } = options;
  const modelId = QUALITY_TO_MODEL_ID[quality];

  return webLLM(modelId, {
    initProgressCallback: onProgress,
  });
}

export function checkWebLLMSupport(): boolean {
  if (typeof window === "undefined") return false;
  return doesBrowserSupportWebLLM();
}

export async function getWebLLMAvailability(
  quality: WebLLMQuality = "standard"
): Promise<WebLLMAvailability> {
  if (!checkWebLLMSupport()) {
    return "unavailable";
  }
  const modelId = QUALITY_TO_MODEL_ID[quality];
  const model = webLLM(modelId);
  return model.availability();
}

export { webLLM };
