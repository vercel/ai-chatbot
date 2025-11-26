"use client";

import {
  doesBrowserSupportWebLLM,
  type WebLLMProgress,
  webLLM,
} from "@built-in-ai/web-llm";

export const WEBLLM_MODEL_ID = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

export type WebLLMAvailability =
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available";

export type { WebLLMProgress };

export function createWebLLMModel(
  onProgress?: (progress: WebLLMProgress) => void
) {
  return webLLM(WEBLLM_MODEL_ID, {
    initProgressCallback: onProgress,
  });
}

export function checkWebLLMSupport(): boolean {
  if (typeof window === "undefined") return false;
  return doesBrowserSupportWebLLM();
}

export async function getWebLLMAvailability(): Promise<WebLLMAvailability> {
  if (!checkWebLLMSupport()) {
    return "unavailable";
  }
  const model = webLLM(WEBLLM_MODEL_ID);
  return model.availability();
}

export { webLLM };
