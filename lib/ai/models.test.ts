import {
  CoreMessage,
  customProvider,
  FinishReason,
  simulateReadableStream,
} from "ai";
import { MockLanguageModelV1 } from "ai/test";

interface TextDeltaChunk {
  type: "text-delta";
  textDelta: string;
}

interface FinishChunk {
  type: "finish";
  finishReason: FinishReason;
  logprobs: undefined;
  usage: { completionTokens: number; promptTokens: number };
}

type Chunk = TextDeltaChunk | FinishChunk;

const getResponseChunksByPrompt = (prompt: CoreMessage[]): Array<Chunk> => {
  const userMessage = prompt.at(-1);

  if (!userMessage) {
    throw new Error("No user message found");
  }

  if (
    compareMessages(userMessage, {
      role: "user",
      content: [{ type: "text", text: "why is grass green?" }],
    })
  ) {
    return [
      { type: "text-delta", textDelta: "it's " },
      { type: "text-delta", textDelta: "just " },
      { type: "text-delta", textDelta: "green " },
      { type: "text-delta", textDelta: "duh!" },
      {
        type: "finish",
        finishReason: "stop",
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (
    compareMessages(userMessage, {
      role: "user",
      content: [{ type: "text", text: "why is the sky blue?" }],
    })
  ) {
    return [
      { type: "text-delta", textDelta: "it's " },
      { type: "text-delta", textDelta: "just " },
      { type: "text-delta", textDelta: "blue " },
      { type: "text-delta", textDelta: "duh!" },
      {
        type: "finish",
        finishReason: "stop",
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (
    compareMessages(userMessage, {
      role: "user",
      content: [
        { type: "text", text: "What are the advantages of using Next.js?" },
      ],
    })
  ) {
    return [
      { type: "text-delta", textDelta: "with " },
      { type: "text-delta", textDelta: "next.js " },
      { type: "text-delta", textDelta: "you " },
      { type: "text-delta", textDelta: "can " },
      { type: "text-delta", textDelta: "ship " },
      { type: "text-delta", textDelta: "fast! " },
      {
        type: "finish",
        finishReason: "stop",
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (
    compareMessages(userMessage, {
      role: "user",
      content: [
        {
          type: "text",
          text: "who painted this?",
        },
        {
          type: "image",
          image: "...",
        },
      ],
    })
  ) {
    return [
      { type: "text-delta", textDelta: "this " },
      { type: "text-delta", textDelta: "painting " },
      { type: "text-delta", textDelta: "is " },
      { type: "text-delta", textDelta: "by " },
      { type: "text-delta", textDelta: "monet!" },
      {
        type: "finish",
        finishReason: "stop",
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  }

  return [];
};

export const chatModel = new MockLanguageModelV1({
  doGenerate: async () => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: 20 },
    text: `Hello, world!`,
  }),
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunks: getResponseChunksByPrompt(prompt),
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

export const reasoningModel = new MockLanguageModelV1({
  doGenerate: async () => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: 20 },
    text: `Hello, world!`,
  }),
  doStream: async () => ({
    stream: simulateReadableStream({
      chunks: [
        { type: "text-delta", textDelta: "test" },
        {
          type: "finish",
          finishReason: "stop",
          logprobs: undefined,
          usage: { completionTokens: 10, promptTokens: 3 },
        },
      ],
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

export const titleModel = new MockLanguageModelV1({
  doGenerate: async () => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: 20 },
    text: `This is a test title`,
  }),
  doStream: async () => ({
    stream: simulateReadableStream({
      chunks: [
        { type: "text-delta", textDelta: "This is a test title" },
        {
          type: "finish",
          finishReason: "stop",
          logprobs: undefined,
          usage: { completionTokens: 10, promptTokens: 3 },
        },
      ],
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

export const artifactModel = new MockLanguageModelV1({
  doGenerate: async () => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: 20 },
    text: `Hello, world!`,
  }),
  doStream: async () => ({
    stream: simulateReadableStream({
      chunks: [
        { type: "text-delta", textDelta: "test" },
        {
          type: "finish",
          finishReason: "stop",
          logprobs: undefined,
          usage: { completionTokens: 10, promptTokens: 3 },
        },
      ],
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

export const testProvider = customProvider({
  languageModels: {
    "chat-model-small": chatModel,
    "chat-model-large": chatModel,
    "chat-model-reasoning": reasoningModel,
    "title-model": titleModel,
    "artifact-model": artifactModel,
  },
});

/**
 * Compares two messages to check if they're equal, handling URL objects
 * by comparing their string representations instead of object equality.
 * Completely ignores all providerMetadata fields during comparison.
 */
function compareMessages(msg1: CoreMessage, msg2: CoreMessage): boolean {
  // Compare message role only
  if (msg1.role !== msg2.role) return false;

  // If content is not an array in both, use deep equality (except providerMetadata)
  if (!Array.isArray(msg1.content) || !Array.isArray(msg2.content)) {
    // For non-array content, we'd need a custom comparison
    // that ignores providerMetadata - simpler to just not support this case
    return false;
  }

  // Check content arrays length
  if (msg1.content.length !== msg2.content.length) return false;

  // Compare each content item
  for (let i = 0; i < msg1.content.length; i++) {
    const item1 = msg1.content[i];
    const item2 = msg2.content[i];

    // If types don't match, they're not equal
    if (item1.type !== item2.type) return false;

    // Handle image content by comparing URL strings only
    if (item1.type === "image" && item2.type === "image") {
      // if (item1.image.toString() !== item2.image.toString()) return false;
      // if (item1.mimeType !== item2.mimeType) return false;
      // Ignore providerMetadata
    }
    // Handle text content - compare text only
    else if (item1.type === "text" && item2.type === "text") {
      if (item1.text !== item2.text) return false;
      // Ignore providerMetadata
    }
    // For other content types, we would need custom comparison
    // that ignores providerMetadata
    else {
      return false;
    }
  }

  // If we got this far, the messages are equal (ignoring providerMetadata)
  return true;
}
