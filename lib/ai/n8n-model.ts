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
  private googleToken: string | null;
  private webhookSecretKey: string | undefined;

  constructor(config: {
    webhookUrl: string;
    modelId: string;
    chatId: string;
    userId: string;
    messageId: string | null;
    datetime: Date | null;
    googleToken?: string | null;
  }) {
    this.webhookUrl = config.webhookUrl;
    this.modelId = config.modelId;
    this.chatId = config.chatId;
    this.userId = config.userId;
    this.messageId = config.messageId;
    this.datetime = config.datetime;
    this.googleToken = config.googleToken ?? null;
    this.webhookSecretKey = process.env.N8N_WEBHOOK_SECRET_KEY;

    if (!this.webhookSecretKey) {
      console.warn(
        '[N8nLanguageModel] N8N_WEBHOOK_SECRET_KEY environment variable is not set. Webhook calls will be unauthenticated.',
      );
    }
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
      ...(this.googleToken && { google_token: this.googleToken }),
    };

    // Log the exact payload being sent
    console.log(
      '[N8nLanguageModel] Sending payload:',
      JSON.stringify(payload, null, 2),
    );

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.webhookSecretKey) {
      headers.Authorization = `Bearer ${this.webhookSecretKey}`;
    }

    // Create promise for n8n response
    const n8nPromise = fetch(this.webhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const rawResponseBody = await response.text();
      console.log('[N8nLanguageModel] Received raw response:', rawResponseBody);

      if (!response.ok) {
        throw new Error(
          `Webhook failed (${response.status}): ${rawResponseBody}`,
        );
      }

      const n8nData = JSON.parse(rawResponseBody);
      return Array.isArray(n8nData) && n8nData[0]?.responseMessage
        ? n8nData[0].responseMessage
        : (n8nData.responseMessage ?? 'Assistant responded without message.');
    });

    // Create stream that combines initial message, keep-alive, and final response
    const stream = simulateReadableStream({
      initialDelayInMs: 0,
      chunkDelayInMs: 1000,
      chunks: [
        {
          type: 'text-delta' as const,
          textDelta:
            "I'm working on your request. This may take a few minutes...",
        },
        // Wait for n8n response
        await n8nPromise.then((text) => ({
          type: 'text-delta' as const,
          textDelta: `\n\n${text}`,
        })),
      ],
    });

    return {
      stream,
      rawCall: {
        rawPrompt: prompt,
        rawSettings: settings,
      },
      finishReason: 'stop',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }
}
