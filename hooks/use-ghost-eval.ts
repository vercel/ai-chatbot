"use client";

import { useState, useCallback } from "react";

export interface GhostEvalRequest {
  prompt: string;
  context?: Record<string, unknown>;
  model?: "chat-model" | "chat-model-reasoning";
}

export interface GhostEvalResponse {
  result: string;
  timestamp: string;
  model: string;
}

export interface GhostEvalError {
  error: string;
  message?: string;
}

export interface UseGhostEvalReturn {
  evaluate: (request: GhostEvalRequest) => Promise<GhostEvalResponse>;
  isLoading: boolean;
  error: GhostEvalError | null;
  lastResult: GhostEvalResponse | null;
}

/**
 * React hook for Ghost Mode evaluations
 * 
 * Usage:
 * ```tsx
 * const { evaluate, isLoading, error, lastResult } = useGhostEval({
 *   apiKey: "your-api-key", // Optional if env var is set
 *   endpoint: "https://your-chatbot.vercel.app/api/ghost" // Optional
 * });
 * 
 * const handleEvaluate = async () => {
 *   try {
 *     const result = await evaluate({
 *       prompt: "Is this email valid: user@example.com?",
 *       context: { field: "email", value: "user@example.com" }
 *     });
 *     console.log(result.result);
 *   } catch (err) {
 *     console.error("Evaluation failed:", err);
 *   }
 * };
 * ```
 */
export function useGhostEval({
  apiKey,
  endpoint = "/api/ghost",
}: {
  apiKey?: string;
  endpoint?: string;
} = {}): UseGhostEvalReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GhostEvalError | null>(null);
  const [lastResult, setLastResult] = useState<GhostEvalResponse | null>(null);

  const evaluate = useCallback(
    async (request: GhostEvalRequest): Promise<GhostEvalResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        // Add API key if provided
        if (apiKey) {
          headers["x-api-key"] = apiKey;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result: GhostEvalResponse = await response.json();
        setLastResult(result);
        return result;
      } catch (err) {
        const ghostError: GhostEvalError = {
          error: "Evaluation failed",
          message: err instanceof Error ? err.message : "Unknown error",
        };
        setError(ghostError);
        throw ghostError;
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, endpoint]
  );

  return {
    evaluate,
    isLoading,
    error,
    lastResult,
  };
}
