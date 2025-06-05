import type { CoreMessage, LanguageModelV1StreamPart } from 'ai';
import { TEST_PROMPTS } from './basic';

export function compareMessages(
  firstMessage: CoreMessage,
  secondMessage: CoreMessage,
): boolean {
  if (firstMessage.role !== secondMessage.role) return false;

  if (
    !Array.isArray(firstMessage.content) ||
    !Array.isArray(secondMessage.content)
  ) {
    return false;
  }

  if (firstMessage.content.length !== secondMessage.content.length) {
    return false;
  }

  for (let i = 0; i < firstMessage.content.length; i++) {
    const item1 = firstMessage.content[i];
    const item2 = secondMessage.content[i];

    if (item1.type !== item2.type) return false;

    if (item1.type === 'image' && item2.type === 'image') {
      // if (item1.image.toString() !== item2.image.toString()) return false;
      // if (item1.mimeType !== item2.mimeType) return false;
    } else if (item1.type === 'text' && item2.type === 'text') {
      if (item1.text !== item2.text) return false;
    } else if (item1.type === 'tool-result' && item2.type === 'tool-result') {
      if (item1.toolCallId !== item2.toolCallId) return false;
    } else {
      return false;
    }
  }

  return true;
}

const textToDeltas = (text: string): LanguageModelV1StreamPart[] => {
  const deltas = text
    .split(' ')
    .map((char) => ({ type: 'text-delta' as const, textDelta: `${char} ` }));

  return deltas;
};

const reasoningToDeltas = (text: string): LanguageModelV1StreamPart[] => {
  const deltas = text
    .split(' ')
    .map((char) => ({ type: 'reasoning' as const, textDelta: `${char} ` }));

  return deltas;
};

export const getResponseChunksByPrompt = (
  prompt: CoreMessage[],
  isReasoningEnabled = false,
): Array<LanguageModelV1StreamPart> => {
  const recentMessage = prompt.at(-1);

  if (!recentMessage) {
    throw new Error('No recent message found!');
  }

  if (isReasoningEnabled) {
    if (compareMessages(recentMessage, TEST_PROMPTS.USER_SKY)) {
      return [
        ...reasoningToDeltas('The sky is blue because of rayleigh scattering!'),
        ...textToDeltas("It's just blue duh!"),
        {
          type: 'finish',
          finishReason: 'stop',
          logprobs: undefined,
          usage: { completionTokens: 10, promptTokens: 3 },
        },
      ];
    } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_GRASS)) {
      return [
        ...reasoningToDeltas(
          'Grass is green because of chlorophyll absorption!',
        ),
        ...textToDeltas("It's just green duh!"),
        {
          type: 'finish',
          finishReason: 'stop',
          logprobs: undefined,
          usage: { completionTokens: 10, promptTokens: 3 },
        },
      ];
    }
  }

  if (compareMessages(recentMessage, TEST_PROMPTS.USER_THANKS)) {
    return [
      ...textToDeltas("You're welcome!"),
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_GRASS)) {
    return [
      ...textToDeltas("It's just green duh!"),
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_SKY)) {
    return [
      ...textToDeltas("It's just blue duh!"),
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_NEXTJS)) {
    return [
      ...textToDeltas('With Next.js, you can ship fast!'),

      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (
    compareMessages(recentMessage, TEST_PROMPTS.USER_IMAGE_ATTACHMENT)
  ) {
    return [
      ...textToDeltas('This painting is by Monet!'),
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_TEXT_ARTIFACT)) {
    return [
      {
        type: 'tool-call',
        toolCallId: 'call_123',
        toolName: 'createDocument',
        toolCallType: 'function',
        args: JSON.stringify({
          title: 'Essay about Silicon Valley',
          kind: 'text',
        }),
      },
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (
    compareMessages(recentMessage, TEST_PROMPTS.CREATE_DOCUMENT_TEXT_CALL)
  ) {
    return [
      ...textToDeltas(`\n
# Silicon Valley: The Epicenter of Innovation

## Origins and Evolution

Silicon Valley, nestled in the southern part of the San Francisco Bay Area, emerged as a global technology hub in the late 20th century. Its transformation began in the 1950s when Stanford University encouraged its graduates to start their own companies nearby, leading to the formation of pioneering semiconductor firms that gave the region its name.

## The Innovation Ecosystem

What makes Silicon Valley unique is its perfect storm of critical elements: prestigious universities like Stanford and Berkeley, abundant venture capital, a culture that celebrates risk-taking, and a dense network of talented individuals. This ecosystem has consistently nurtured groundbreaking technologies from personal computers to social media platforms to artificial intelligence.

## Challenges and Criticisms

Despite its remarkable success, Silicon Valley faces significant challenges including extreme income inequality, housing affordability crises, and questions about technology's impact on society. Critics argue the region has developed a monoculture that sometimes struggles with diversity and inclusion.

## Future Prospects

As we move forward, Silicon Valley continues to reinvent itself. While some predict its decline due to remote work trends and competition from other tech hubs, the region's adaptability and innovative spirit suggest it will remain influential in shaping our technological future for decades to come.
`),
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (
    compareMessages(recentMessage, TEST_PROMPTS.CREATE_DOCUMENT_TEXT_RESULT)
  ) {
    return [
      {
        type: 'text-delta',
        textDelta: 'A document was created and is now visible to the user.',
      },
      {
        type: 'finish',
        finishReason: 'tool-calls',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (compareMessages(recentMessage, TEST_PROMPTS.GET_WEATHER_CALL)) {
    return [
      {
        type: 'tool-call',
        toolCallId: 'call_456',
        toolName: 'getWeather',
        toolCallType: 'function',
        args: JSON.stringify({ latitude: 37.7749, longitude: -122.4194 }),
      },
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (compareMessages(recentMessage, TEST_PROMPTS.GET_WEATHER_RESULT)) {
    return [
      ...textToDeltas('The current temperature in San Francisco is 17°C.'),
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  }

  return [{ type: 'text-delta', textDelta: 'Unknown test prompt!' }];
};
