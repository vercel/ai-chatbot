const DEBUG = process.env.DEBUG === "true";

/**
 * NLP Worker Client for Voice Chat
 *
 * **Optional Service** - This client connects to an external NLP Worker service
 * for advanced End-of-Turn (EOT) detection. The service is completely optional.
 * If unavailable, the application will fall back to simple heuristics.
 *
 * Simplified TypeScript client for communicating with the Python nlp-worker service.
 * Based on: /Users/josiahbryan/devel/rubber/backend/src/services/ai/utils/NlpWorkerClient.js
 *
 * Supports:
 * - EOT (End of Turn) detection for voice chat
 * - Text embedding (GTE-Base-EN-v1.5)
 * - Audio embedding (ECAPA-TDNN speaker embeddings)
 * - Text generation (VibeThinker, Granite models)
 *
 * Environment Variables (Optional):
 * - NLP_WORKER_URL: URL of the nlp-worker service (default: http://localhost:8097)
 * - NLP_WORKER_API_KEY: API key for authentication
 *
 * If NLP_WORKER_URL is not set, all methods will return errors gracefully,
 * allowing the application to use fallback logic.
 */

export type EOTChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type EOTRequest = {
  chat_history: EOTChatMessage[];
  current_utterance: string;
};

export type EOTResponse = {
  eou_probability: number;
  unlikely_threshold: number;
  is_end_of_utterance: boolean;
};

export type NlpWorkerError = {
  error: string;
  status?: number;
};

export type NlpWorkerClientOptions = {
  nlpWorkerUrl?: string;
  apiKey?: string;
  maxRetries?: number;
  /** Silence warnings when service is unavailable (useful for tests) */
  silent?: boolean;
};

/**
 * Client for interacting with the NLP Worker service
 *
 * This client is designed to fail gracefully when the service is unavailable.
 * All methods return either the result or an error object, never throwing exceptions.
 */
export class NlpWorkerClient {
  private readonly nlpWorkerUrl: string;
  private readonly apiKey: string;
  private readonly maxRetries: number;
  private readonly silent: boolean;

  constructor(options: NlpWorkerClientOptions = {}) {
    this.nlpWorkerUrl =
      options.nlpWorkerUrl ||
      process.env.NLP_WORKER_URL ||
      "http://localhost:8097";

    this.apiKey = options.apiKey || process.env.NLP_WORKER_API_KEY || "";

    this.maxRetries = options.maxRetries || 3;
    this.silent = options.silent || false;

    // Log configuration status when debugging
    if (!this.silent && DEBUG) {
      const hasUrl = Boolean(
        options.nlpWorkerUrl || process.env.NLP_WORKER_URL
      );
      if (hasUrl) {
        console.log("[NlpWorkerClient] Configured with NLP Worker service");
      } else {
        console.log(
          "[NlpWorkerClient] NLP_WORKER_URL not set - will use fallback heuristics"
        );
      }
    }
  }

  /**
   * Check if the NLP Worker service is configured and potentially available
   */
  isConfigured(): boolean {
    return Boolean(process.env.NLP_WORKER_URL);
  }

  /**
   * Detect End of Turn (EOT) for voice chat
   *
   * Determines if the user has finished speaking or is just pausing.
   * Uses the livekit/turn-detector model.
   *
   * @param history - Array of chat messages (conversation context)
   * @returns EOT response with probability and decision, or error
   *
   * @example
   * ```typescript
   * const client = new NlpWorkerClient();
   * const result = await client.detectEOT([
   *   { role: 'user', content: 'Hello' },
   *   { role: 'assistant', content: 'Hi there!' },
   *   { role: 'user', content: 'Can you help me with' }, // Incomplete
   * ]);
   *
   * if ('error' in result) {
   *   console.error('EOT failed:', result.error);
   * } else {
   *   console.log('Is complete?', result.is_end_of_utterance); // false
   *   console.log('Probability:', result.eou_probability); // ~0.05
   * }
   * ```
   */
  async detectEOT(
    history: EOTChatMessage[]
  ): Promise<EOTResponse | NlpWorkerError> {
    if (!history || history.length === 0) {
      return { error: "No chat history provided" };
    }

    // Extract last message as current utterance
    const messages = [...history];
    const lastMessage = messages.pop();

    if (!lastMessage) {
      return { error: "Chat history must have at least one message" };
    }

    // Format for Python API
    const chatData = [
      {
        id: "request",
        chat_history: messages,
        current_utterance: lastMessage.content,
      },
    ];

    const result = await this._callNlpWorker<{ results: EOTResponse[] }>({
      apiPath: "/api/eot",
      method: "POST",
      body: { chats: chatData },
    });

    if ("error" in result) {
      return result;
    }

    // Return first result
    return result.results?.[0] || { error: "No result from EOT endpoint" };
  }

  /**
   * Get version information from NLP Worker
   */
  version(): Promise<{ version: string; models: string[] } | NlpWorkerError> {
    return this._callNlpWorker({
      apiPath: "/api/version",
      method: "GET",
    });
  }

  /**
   * Internal method to call NLP Worker API
   */
  private async _callNlpWorker<T = unknown>({
    apiPath,
    method = "POST",
    body,
    retryCount = 0,
  }: {
    apiPath: string;
    method?: "GET" | "POST";
    body?: unknown;
    retryCount?: number;
  }): Promise<T | NlpWorkerError> {
    // Early return if service not configured
    if (!this.isConfigured()) {
      return {
        error: "NLP Worker service not configured",
        status: 503,
      };
    }

    const url = `${this.nlpWorkerUrl}${apiPath}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: this.apiKey } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle error responses
      if (!response.ok) {
        const errorText = await response.text();
        let errorData: unknown;

        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = errorText;
        }

        // Retry on rate limits or service unavailable
        if (
          [429, 502, 503].includes(response.status) &&
          retryCount < this.maxRetries
        ) {
          const delay = Math.random() * 1000 + retryCount * 500;

          if (!this.silent && DEBUG) {
            console.log(
              `[NlpWorkerClient] ${response.status} error, retrying in ${delay}ms (${retryCount + 1}/${this.maxRetries})`
            );
          }

          await new Promise((resolve) => setTimeout(resolve, delay));

          return this._callNlpWorker({
            apiPath,
            method,
            body,
            retryCount: retryCount + 1,
          });
        }

        // Service unavailable, return error for fallback
        if (!this.silent && DEBUG) {
          console.log(
            "[NlpWorkerClient] Service unavailable - will use fallback logic"
          );
        }

        return {
          error:
            typeof errorData === "object" && errorData && "error" in errorData
              ? String(errorData.error)
              : String(errorData),
          status: response.status,
        };
      }

      // Parse successful response
      const data = (await response.json()) as T;
      return data;
    } catch (error) {
      // Service unreachable, return error for fallback
      if (!this.silent && DEBUG) {
        console.log(
          "[NlpWorkerClient] Service unreachable - will use fallback logic"
        );
      }

      return {
        error: error instanceof Error ? error.message : "Service unavailable",
        status: 503,
      };
    }
  }
}

// Export singleton instance for convenience
export const nlpWorkerClient = new NlpWorkerClient();
