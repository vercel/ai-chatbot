import { CoreMessage, FinishReason, simulateReadableStream } from 'ai';
import { MockLanguageModelV1 } from 'ai/test';

interface ReasoningChunk {
  type: 'reasoning';
  textDelta: string;
}

interface TextDeltaChunk {
  type: 'text-delta';
  textDelta: string;
}

interface FinishChunk {
  type: 'finish';
  finishReason: FinishReason;
  logprobs: undefined;
  usage: { completionTokens: number; promptTokens: number };
}

type Chunk = TextDeltaChunk | ReasoningChunk | FinishChunk;

const getResponseChunksByPrompt = (
  prompt: CoreMessage[],
  isReasoningEnabled: boolean = false,
): Array<Chunk> => {
  const userMessage = prompt.at(-1);

  if (!userMessage) {
    throw new Error('No user message found');
  }

  if (isReasoningEnabled) {
    if (
      compareMessages(userMessage, {
        role: 'user',
        content: [{ type: 'text', text: 'why is the sky blue?' }],
      })
    ) {
      return [
        { type: 'reasoning', textDelta: 'the ' },
        { type: 'reasoning', textDelta: 'sky ' },
        { type: 'reasoning', textDelta: 'is ' },
        { type: 'reasoning', textDelta: 'blue ' },
        { type: 'reasoning', textDelta: 'because ' },
        { type: 'reasoning', textDelta: 'of ' },
        { type: 'reasoning', textDelta: 'rayleigh ' },
        { type: 'reasoning', textDelta: 'scattering! ' },
        { type: 'text-delta', textDelta: "it's " },
        { type: 'text-delta', textDelta: 'just ' },
        { type: 'text-delta', textDelta: 'blue ' },
        { type: 'text-delta', textDelta: 'duh!' },
        {
          type: 'finish',
          finishReason: 'stop',
          logprobs: undefined,
          usage: { completionTokens: 10, promptTokens: 3 },
        },
      ];
    } else if (
      compareMessages(userMessage, {
        role: 'user',
        content: [{ type: 'text', text: 'why is grass green?' }],
      })
    ) {
      return [
        { type: 'reasoning', textDelta: 'grass ' },
        { type: 'reasoning', textDelta: 'is ' },
        { type: 'reasoning', textDelta: 'green ' },
        { type: 'reasoning', textDelta: 'because ' },
        { type: 'reasoning', textDelta: 'of ' },
        { type: 'reasoning', textDelta: 'chlorophyll ' },
        { type: 'reasoning', textDelta: 'absorption! ' },
        { type: 'text-delta', textDelta: "it's " },
        { type: 'text-delta', textDelta: 'just ' },
        { type: 'text-delta', textDelta: 'green ' },
        { type: 'text-delta', textDelta: 'duh!' },
        {
          type: 'finish',
          finishReason: 'stop',
          logprobs: undefined,
          usage: { completionTokens: 10, promptTokens: 3 },
        },
      ];
    }
  }

  if (
    compareMessages(userMessage, {
      role: 'user',
      content: [{ type: 'text', text: 'why is grass green?' }],
    })
  ) {
    return [
      { type: 'text-delta', textDelta: "it's " },
      { type: 'text-delta', textDelta: 'just ' },
      { type: 'text-delta', textDelta: 'green ' },
      { type: 'text-delta', textDelta: 'duh!' },
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (
    compareMessages(userMessage, {
      role: 'user',
      content: [{ type: 'text', text: 'why is the sky blue?' }],
    })
  ) {
    return [
      { type: 'text-delta', textDelta: "it's " },
      { type: 'text-delta', textDelta: 'just ' },
      { type: 'text-delta', textDelta: 'blue ' },
      { type: 'text-delta', textDelta: 'duh!' },
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (
    compareMessages(userMessage, {
      role: 'user',
      content: [
        { type: 'text', text: 'What are the advantages of using Next.js?' },
      ],
    })
  ) {
    return [
      { type: 'text-delta', textDelta: 'with ' },
      { type: 'text-delta', textDelta: 'next.js ' },
      { type: 'text-delta', textDelta: 'you ' },
      { type: 'text-delta', textDelta: 'can ' },
      { type: 'text-delta', textDelta: 'ship ' },
      { type: 'text-delta', textDelta: 'fast! ' },
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (
    compareMessages(userMessage, {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'who painted this?',
        },
        {
          type: 'image',
          image: '...',
        },
      ],
    })
  ) {
    return [
      { type: 'text-delta', textDelta: 'this ' },
      { type: 'text-delta', textDelta: 'painting ' },
      { type: 'text-delta', textDelta: 'is ' },
      { type: 'text-delta', textDelta: 'by ' },
      { type: 'text-delta', textDelta: 'monet!' },
      {
        type: 'finish',
        finishReason: 'stop',
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
    finishReason: 'stop',
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
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20 },
    text: `Hello, world!`,
  }),
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunks: getResponseChunksByPrompt(prompt, true),
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

export const titleModel = new MockLanguageModelV1({
  doGenerate: async () => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20 },
    text: `This is a test title`,
  }),
  doStream: async () => ({
    stream: simulateReadableStream({
      chunks: [
        { type: 'text-delta', textDelta: 'This is a test title' },
        {
          type: 'finish',
          finishReason: 'stop',
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
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20 },
    text: `Hello, world!`,
  }),
  doStream: async () => ({
    stream: simulateReadableStream({
      chunks: [
        { type: 'text-delta', textDelta: 'test' },
        {
          type: 'finish',
          finishReason: 'stop',
          logprobs: undefined,
          usage: { completionTokens: 10, promptTokens: 3 },
        },
      ],
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

function compareMessages(msg1: CoreMessage, msg2: CoreMessage): boolean {
  if (msg1.role !== msg2.role) return false;

  if (!Array.isArray(msg1.content) || !Array.isArray(msg2.content)) {
    return false;
  }

  if (msg1.content.length !== msg2.content.length) return false;

  for (let i = 0; i < msg1.content.length; i++) {
    const item1 = msg1.content[i];
    const item2 = msg2.content[i];

    if (item1.type !== item2.type) return false;

    if (item1.type === 'image' && item2.type === 'image') {
      // if (item1.image.toString() !== item2.image.toString()) return false;
      // if (item1.mimeType !== item2.mimeType) return false;
    } else if (item1.type === 'text' && item2.type === 'text') {
      if (item1.text !== item2.text) return false;
    } else {
      return false;
    }
  }

  return true;
}
