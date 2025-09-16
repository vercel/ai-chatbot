import type { LanguageModel } from 'ai';
import { getResponseChunksByPrompt } from '../../tests/prompts/utils';
import type {
  LanguageModelV2StreamPart,
  LanguageModelV2CallOptions,
  LanguageModelV2Prompt,
} from '@ai-sdk/provider';

const createMockModel = (isReasoningEnabled = false): LanguageModel => {
  return {
    specificationVersion: 'v2',
    provider: 'mock',
    modelId: 'mock-model',
    defaultObjectGenerationMode: 'tool',
    supportedUrls: [],
    supportsImageUrls: false,
    supportsStructuredOutputs: false,
    doGenerate: async ({ prompt }: LanguageModelV2CallOptions) => {
      const chunks = getResponseChunksByPrompt(
        prompt as LanguageModelV2Prompt,
        isReasoningEnabled,
      );
      const textChunks = chunks.filter(
        (chunk): chunk is { type: 'text-delta'; delta: string; id: string } =>
          chunk.type === 'text-delta',
      );
      const fullText = textChunks.map((chunk) => chunk.delta).join('');

      return {
        rawCall: { rawPrompt: null, rawSettings: {} },
        finishReason: 'stop' as const,
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        content: [{ type: 'text', text: fullText }],
        warnings: [],
      };
    },
    doStream: async ({ prompt }: LanguageModelV2CallOptions) => {
      const messages = prompt;
      const chunks = getResponseChunksByPrompt(messages, isReasoningEnabled);

      return {
        stream: new ReadableStream<LanguageModelV2StreamPart>({
          async start(controller) {
            for (const chunk of chunks) {
              controller.enqueue(chunk);
              // add a small delay to simulate streaming
              await new Promise((resolve) => setTimeout(resolve, 10));
            }
            controller.close();
          },
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
      };
    },
  } as unknown as LanguageModel;
};

export const chatModel = createMockModel();
export const reasoningModel = createMockModel(true);
export const titleModel = createMockModel();
export const artifactModel = createMockModel();
