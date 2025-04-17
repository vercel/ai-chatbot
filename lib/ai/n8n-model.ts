'use strict';

import {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1Prompt,
  LanguageModelV1StreamPart,
  UnsupportedFunctionalityError,
} from 'ai';
import { simulateReadableStream } from 'ai/test'; // Using simulateReadableStream for simplicity

// Define the expected structure of the message payload sent to n8n
interface N8nPayload {
  chatId: string;
  userId: string;
  userMessage: any; // Define more specifically if needed
  history: any[]; // Define more specifically if needed
}

// Define the expected structure of the n8n webhook response
// Adjust based on actual response (can handle array or object)
type N8nResponse =
  | { responseMessage?: string }
  | Array<{ responseMessage?: string }>;

export class N8nLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = 'v1';
  readonly defaultObjectGenerationMode = undefined; // Not applicable
  readonly provider = 'custom-n8n'; // Custom provider name
  readonly modelId: string;
  private webhookUrl: string;

  constructor(config: { webhookUrl: string; modelId: string }) {
    this.webhookUrl = config.webhookUrl;
    this.modelId = config.modelId; // e.g., 'n8n-assistant'
  }

  // doGenerate is not suitable for streaming, throw error
  async doGenerate(
    options: LanguageModelV1CallOptions<LanguageModelV1Prompt>,
  ): Promise<any> {
    throw new UnsupportedFunctionalityError({
      provider: this.provider,
      modelId: this.modelId,
      functionality: 'doGenerate',
    });
  }

  // doStream handles the actual call to the n8n webhook
  async doStream(
    options: LanguageModelV1CallOptions<LanguageModelV1Prompt>,
  ): Promise<{
    stream: ReadableStream<LanguageModelV1StreamPart>;
    rawCall: { rawPrompt: any; rawSettings: Record<string, unknown> };
    rawResponse?: { headers?: Record<string, string> };
    finishReason:
      | 'stop'
      | 'length'
      | 'content-filter'
      | 'tool-calls'
      | 'other'
      | 'error';
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    logprobs?: Array<any>; // Adjust type as needed
  }> {
    const { prompt, mode, ...settings } = options;

    // Extract messages - assuming prompt is an array of messages
    // The actual structure depends on how streamText formats it.
    // We expect the full message history here.
    const messages = prompt as any[]; // Cast for now, refine if needed

    // Construct payload for n8n (adapt based on actual needs)
    // This requires careful handling of message structure and context.
    // Placeholder: assuming the last message is the user's current one.
    const userMessage = messages[messages.length - 1];
    const history = messages.slice(0, -1);
    // We might need chatId and userId passed differently, perhaps via settings?
    const payload: N8nPayload = {
      chatId: (settings as any).chatId || 'unknown-chat', // Get from settings if passed
      userId: (settings as any).userId || 'unknown-user', // Get from settings if passed
      userMessage: userMessage,
      history: history,
    };

    let assistantReplyText = 'Error fetching response from assistant.';
    let finishReason: 'stop' | 'error' = 'error';
    let responseHeaders: Record<string, string> | undefined = undefined;

    try {
      console.log(`[N8nLanguageModel] Calling webhook: ${this.webhookUrl}`);
      const n8nResponse = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      responseHeaders = Object.fromEntries(n8nResponse.headers.entries());

      if (!n8nResponse.ok) {
        const errorBody = await n8nResponse.text();
        console.error(
          `[N8nLanguageModel] Webhook call failed (${n8nResponse.status}): ${errorBody}`,
        );
        assistantReplyText = `Assistant communication failed (${n8nResponse.status})`;
        // Keep finishReason as 'error'
      } else {
        const n8nData: N8nResponse = await n8nResponse.json();
        console.log(
          `[N8nLanguageModel] Raw response data: ${JSON.stringify(n8nData)}`,
        );

        // Parse response (handle array or object)
        assistantReplyText =
          Array.isArray(n8nData) && n8nData[0]?.responseMessage
            ? n8nData[0].responseMessage
            : typeof n8nData === 'object' &&
                n8nData !== null &&
                'responseMessage' in n8nData
              ? (n8nData.responseMessage ??
                'Assistant responded without message.')
              : 'Assistant response format unknown.';
        finishReason = 'stop'; // Success
      }
    } catch (error: any) {
      console.error('[N8nLanguageModel] Fetch error:', error);
      assistantReplyText = `Error contacting assistant: ${error.message}`;
      // Keep finishReason as 'error'
    }

    // Create a stream that yields a single text delta with the full response
    const stream = simulateReadableStream({
      chunks: [{ type: 'text-delta', textDelta: assistantReplyText }],
    });

    // Return structure matching LanguageModelV1DoStreamResult
    return {
      stream,
      finishReason,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, // Usage is unknown
      rawCall: { rawPrompt: prompt, rawSettings: settings },
      rawResponse: { headers: responseHeaders },
    };
  }
}
