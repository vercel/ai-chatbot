import type { LanguageModel } from "ai";

const createMockModel = (): LanguageModel => {
  return {
    specificationVersion: "v2",
    provider: "mock",
    modelId: "mock-model",
    defaultObjectGenerationMode: "tool",
    supportedUrls: [],
    supportsImageUrls: false,
    supportsStructuredOutputs: false,
    doGenerate: async () => ({
      rawCall: { rawPrompt: null, rawSettings: {} },
      finishReason: "stop",
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
      content: [{ type: "text", text: "Hello! I'm Grok, built by xAI. I'm here to help with any questions you have. What can I assist you with today?" }],
      warnings: [],
    }),
    doStream: async () => ({
      stream: new ReadableStream({
        pull(controller) {
          controller.enqueue({
            type: "text-delta",
            id: "mock-0",
            delta: "Hello! I'm Grok, built by xAI. I'm here to help with any questions you have. What can I assist you with today?",
          });
          controller.close();
        },
      }),
      rawCall: { rawPrompt: null, rawSettings: {} },
    }),
  } as unknown as LanguageModel;
};

export const chatModel = createMockModel();
export const reasoningModel = createMockModel();
export const titleModel = createMockModel();
export const artifactModel = createMockModel();
