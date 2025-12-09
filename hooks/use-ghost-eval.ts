"use client";

import { useCallback, useState } from "react";

export interface GhostEvalRequest {
  prompt: string;
  content?: string;
  context?: Record<string, unknown>;
  model?: "chat-model" | "chat-model-reasoning";
}

export interface GhostEvalResponse {
  score?: number;
  feedback?: string;
  result: string;
  timestamp: string;
  model?: string;
  confidence?: number;
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
 * React hook for Ghost Mode evaluations via AgentOS
 *
 * **Updated for AgentOS v1.0:** This hook now uses `/api/agent-router` instead of the legacy `/api/ghost` endpoint.
 *
 * Usage:
 * ```tsx
 * const { evaluate, isLoading, error, lastResult } = useGhostEval({
 *   apiKey: "your-api-key", // Optional if env var is set
 *   origin: "tiqology-spa" // Your app identifier
 * });
 *
 * const handleEvaluate = async () => {
 *   try {
 *     const result = await evaluate({
 *       prompt: "Is this email valid?",
 *       content: "user@example.com",
 *       context: { field: "email", expectedFormat: "professional" }
 *     });
 *     console.log(result.score, result.feedback);
 *   } catch (err) {
 *     console.error("Evaluation failed:", err);
 *   }
 * };
 * ```
 */
export function useGhostEval({
  apiKey,
  origin = "unknown-app",
  endpoint = "/api/agent-router",
}: {
  apiKey?: string;
  origin?: string;
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

        // Build AgentOS task following canonical format
        const task = {
          id: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          origin,
          targetAgents: ["ghost-evaluator"],
          domain: "general",
          kind: "evaluation",
          priority: "normal",
          payload: {
            evaluationPrompt: request.prompt,
            content: request.content || "",
            context: request.context || {},
            model: request.model || "chat-model",
          },
          metadata: {
            hookVersion: "2.0.0-agentos",
            timestamp: new Date().toISOString(),
          },
        };

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({ task }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || `HTTP ${response.status}`
          );
        }

        const agentResult = await response.json();

        // Transform AgentOS response to GhostEvalResponse format
        const result: GhostEvalResponse = {
          score: agentResult.result?.data?.score,
          feedback: agentResult.result?.data?.feedback,
          result:
            agentResult.result?.data?.analysis ||
            agentResult.result?.data?.feedback ||
            "",
          timestamp: new Date(agentResult.completedAt).toISOString(),
          model: request.model,
          confidence: agentResult.result?.confidence,
        };

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
    [apiKey, origin, endpoint]
  );

  return {
    evaluate,
    isLoading,
    error,
    lastResult,
  };
}
