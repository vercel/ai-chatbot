'use strict';

import type {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1Prompt,
  LanguageModelV1StreamPart,
  CoreMessage,
} from 'ai';
import { UnsupportedFunctionalityError } from 'ai';
import { simulateReadableStream } from 'ai/test';

// Define the expected structure of the message payload sent to n8n
interface N8nPayload {
  chatId: string;
  userId: string;
  userMessage: any; // Define more specifically if needed
  history: any[]; // Define more specifically if needed
}

// Define the expected structure of the n8n webhook response
type N8nResponse =
  | { responseMessage?: string }
  | Array<{ responseMessage?: string }>;

export class N8nLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = 'v1';
  readonly defaultObjectGenerationMode = undefined;
  readonly provider = 'custom-n8n';
  readonly modelId: string;
  private webhookUrl: string;
  private chatId: string;
  private userId: string;
  private messageId: string | null;
  private datetime: Date | null;

  constructor(config: {
    webhookUrl: string;
    modelId: string;
    chatId: string;
    userId: string;
    messageId: string | null;
    datetime: Date | null;
  }) {
    this.webhookUrl = config.webhookUrl;
    this.modelId = config.modelId;
    this.chatId = config.chatId;
    this.userId = config.userId;
    this.messageId = config.messageId;
    this.datetime = config.datetime;
  }

  async doGenerate(
    options: LanguageModelV1CallOptions, // Corrected: Not generic
  ): Promise<any> {
    throw new UnsupportedFunctionalityError({
      functionality: 'doGenerate', // Corrected: only accepts functionality
    });
  }

  async doStream(
    options: LanguageModelV1CallOptions, // Corrected: Not generic
  ): Promise<{
    stream: ReadableStream<LanguageModelV1StreamPart>;
    rawCall: {
      rawPrompt: LanguageModelV1Prompt;
      rawSettings: Record<string, unknown>;
    };
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
    logprobs?: Array<any>;
  }> {
    const { prompt, mode, ...settings } = options;
    const coreMessages = prompt as CoreMessage[];

    const userMessage =
      coreMessages.length > 0 ? coreMessages[coreMessages.length - 1] : null;

    // --- Corrected Payload Extraction based on CoreMessage structure ---
    let userMessageParts: Array<{ type: string; text: string }> | null = null;
    let userMessageText = ''; // Define userMessageText here

    if (userMessage?.content && Array.isArray(userMessage.content)) {
      // Content is likely an array of parts for multimodal
      userMessageParts = userMessage.content as Array<{
        type: string;
        text: string;
      }>; // Assuming structure {type: 'text', text: '...'}
      if (userMessageParts) {
        userMessageText = userMessageParts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('\n')
          .trim();
      }
    } else if (typeof userMessage?.content === 'string') {
      // Content is just a string
      userMessageText = userMessage.content.trim();
      userMessageParts = [{ type: 'text', text: userMessageText }]; // Create a simple parts array
    }

    const history = coreMessages.length > 1 ? coreMessages.slice(0, -1) : [];

    // Use stored chatId, userId, messageId, and datetime
    const payload = {
      chatId: this.chatId,
      userId: this.userId,
      messageId: this.messageId,
      userMessage: userMessageText,
      userMessageParts: userMessageParts,
      userMessageDatetime: this.datetime,
      history: history,
    };

    // Log the exact payload being sent
    console.log(
      '[N8nLanguageModel] Sending payload:',
      JSON.stringify(payload, null, 2),
    );

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
      } else {
        // Attempt to parse the logged text
        try {
          const n8nData: N8nResponse = JSON.parse(await n8nResponse.text());
          assistantReplyText =
            Array.isArray(n8nData) && n8nData[0]?.responseMessage
              ? n8nData[0].responseMessage
              : typeof n8nData === 'object' &&
                  n8nData !== null &&
                  'responseMessage' in n8nData
                ? (n8nData.responseMessage ??
                  'Assistant responded without message.')
                : 'Assistant response format unknown.';
          finishReason = 'stop';
        } catch (parseError: any) {
          console.error('[N8nLanguageModel] JSON parse error:', parseError);
          assistantReplyText = `Error parsing assistant response: ${parseError.message}`;
          finishReason = 'error'; // Set finishReason to error on parse fail
        }
      }
    } catch (error: any) {
      console.error('[N8nLanguageModel] Fetch error:', error);
      assistantReplyText = `Error contacting assistant: ${error.message}`;
    }

    // Create a stream that yields a single text delta
    const streamChunk: LanguageModelV1StreamPart = {
      // Explicitly type the chunk
      type: 'text-delta',
      textDelta: assistantReplyText,
    };
    const stream = simulateReadableStream({
      chunks: [streamChunk],
    });

    return {
      stream,
      finishReason,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      rawCall: { rawPrompt: prompt, rawSettings: settings },
      rawResponse: { headers: responseHeaders },
    };
  }
}
