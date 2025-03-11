import { CoreMessage, LanguageModelV1StreamPart } from 'ai';
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

export const getResponseChunksByPrompt = (
  prompt: CoreMessage[],
  isReasoningEnabled: boolean = false,
): Array<LanguageModelV1StreamPart> => {
  const recentMessage = prompt.at(-1);

  if (!recentMessage) {
    throw new Error('No recent message found!');
  }

  if (isReasoningEnabled) {
    if (compareMessages(recentMessage, TEST_PROMPTS.USER_SKY)) {
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
    } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_GRASS)) {
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

  if (compareMessages(recentMessage, TEST_PROMPTS.USER_THANKS)) {
    return [
      { type: 'text-delta', textDelta: "you're " },
      { type: 'text-delta', textDelta: 'welcome!' },
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_GRASS)) {
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
  } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_SKY)) {
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
  } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_NEXTJS)) {
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
    compareMessages(recentMessage, TEST_PROMPTS.USER_IMAGE_ATTACHMENT)
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
  } else if (compareMessages(recentMessage, TEST_PROMPTS.USER_TEXT_ARTIFACT)) {
    return [
      {
        type: 'tool-call',
        toolCallId: 'call_123',
        toolName: 'createDocument',
        toolCallType: 'function',
        args: JSON.stringify({
          title: 'Haiku about Noe Valley',
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
      { type: 'text-delta', textDelta: '# ' },
      { type: 'text-delta', textDelta: 'Silicon ' },
      { type: 'text-delta', textDelta: 'Valley: ' },
      { type: 'text-delta', textDelta: 'The ' },
      { type: 'text-delta', textDelta: 'Heart ' },
      { type: 'text-delta', textDelta: 'of ' },
      { type: 'text-delta', textDelta: 'Innovation\n\n' },
      { type: 'text-delta', textDelta: '## ' },
      { type: 'text-delta', textDelta: 'Introduction\n' },
      { type: 'text-delta', textDelta: 'Silicon ' },
      { type: 'text-delta', textDelta: 'Valley, ' },
      { type: 'text-delta', textDelta: 'located ' },
      { type: 'text-delta', textDelta: 'in ' },
      { type: 'text-delta', textDelta: "California's " },
      { type: 'text-delta', textDelta: 'San ' },
      { type: 'text-delta', textDelta: 'Francisco ' },
      { type: 'text-delta', textDelta: 'Bay ' },
      { type: 'text-delta', textDelta: 'Area, ' },
      { type: 'text-delta', textDelta: 'is ' },
      { type: 'text-delta', textDelta: 'the ' },
      { type: 'text-delta', textDelta: 'global ' },
      { type: 'text-delta', textDelta: 'epicenter ' },
      { type: 'text-delta', textDelta: 'of ' },
      { type: 'text-delta', textDelta: 'technology ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'entrepreneurship. ' },
      { type: 'text-delta', textDelta: 'Its ' },
      { type: 'text-delta', textDelta: 'rise ' },
      { type: 'text-delta', textDelta: 'began ' },
      { type: 'text-delta', textDelta: 'in ' },
      { type: 'text-delta', textDelta: 'the ' },
      { type: 'text-delta', textDelta: 'mid-20th ' },
      { type: 'text-delta', textDelta: 'century, ' },
      { type: 'text-delta', textDelta: 'fueled ' },
      { type: 'text-delta', textDelta: 'by ' },
      { type: 'text-delta', textDelta: 'Stanford ' },
      { type: 'text-delta', textDelta: 'University ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'the ' },
      { type: 'text-delta', textDelta: 'emergence ' },
      { type: 'text-delta', textDelta: 'of ' },
      { type: 'text-delta', textDelta: 'companies ' },
      { type: 'text-delta', textDelta: 'like ' },
      { type: 'text-delta', textDelta: 'Hewlett-Packard.\n\n' },
      { type: 'text-delta', textDelta: '## ' },
      { type: 'text-delta', textDelta: 'The ' },
      { type: 'text-delta', textDelta: 'Origins ' },
      { type: 'text-delta', textDelta: 'of ' },
      { type: 'text-delta', textDelta: 'Silicon ' },
      { type: 'text-delta', textDelta: 'Valley\n' },
      { type: 'text-delta', textDelta: '### ' },
      { type: 'text-delta', textDelta: 'The ' },
      { type: 'text-delta', textDelta: 'Birth ' },
      { type: 'text-delta', textDelta: 'of ' },
      { type: 'text-delta', textDelta: 'a ' },
      { type: 'text-delta', textDelta: 'Name\n' },
      { type: 'text-delta', textDelta: 'The ' },
      { type: 'text-delta', textDelta: 'term ' },
      { type: 'text-delta', textDelta: '"Silicon ' },
      { type: 'text-delta', textDelta: 'Valley" ' },
      { type: 'text-delta', textDelta: 'originated ' },
      { type: 'text-delta', textDelta: 'in ' },
      { type: 'text-delta', textDelta: 'the ' },
      { type: 'text-delta', textDelta: '1970s, ' },
      { type: 'text-delta', textDelta: 'highlighting ' },
      { type: 'text-delta', textDelta: 'the ' },
      { type: 'text-delta', textDelta: "region's " },
      { type: 'text-delta', textDelta: 'focus ' },
      { type: 'text-delta', textDelta: 'on ' },
      { type: 'text-delta', textDelta: 'silicon-based ' },
      { type: 'text-delta', textDelta: 'semiconductors.\n\n' },
      { type: 'text-delta', textDelta: '### ' },
      { type: 'text-delta', textDelta: 'Key ' },
      { type: 'text-delta', textDelta: 'Influencers\n' },
      { type: 'text-delta', textDelta: 'Today, ' },
      { type: 'text-delta', textDelta: 'it ' },
      { type: 'text-delta', textDelta: 'hosts ' },
      { type: 'text-delta', textDelta: 'thousands ' },
      { type: 'text-delta', textDelta: 'of ' },
      { type: 'text-delta', textDelta: 'startups ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'major ' },
      { type: 'text-delta', textDelta: 'companies ' },
      { type: 'text-delta', textDelta: 'like ' },
      { type: 'text-delta', textDelta: 'Apple ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'Google, ' },
      { type: 'text-delta', textDelta: 'driven ' },
      { type: 'text-delta', textDelta: 'by ' },
      { type: 'text-delta', textDelta: 'a ' },
      { type: 'text-delta', textDelta: 'culture ' },
      { type: 'text-delta', textDelta: 'of ' },
      { type: 'text-delta', textDelta: 'innovation ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'risk-taking.\n\n' },
      { type: 'text-delta', textDelta: '## ' },
      { type: 'text-delta', textDelta: 'The ' },
      { type: 'text-delta', textDelta: 'Role ' },
      { type: 'text-delta', textDelta: 'of ' },
      { type: 'text-delta', textDelta: 'Venture ' },
      { type: 'text-delta', textDelta: 'Capital\n' },
      { type: 'text-delta', textDelta: '### ' },
      { type: 'text-delta', textDelta: 'Funding ' },
      { type: 'text-delta', textDelta: 'Innovation\n' },
      { type: 'text-delta', textDelta: 'Venture ' },
      { type: 'text-delta', textDelta: 'capital ' },
      { type: 'text-delta', textDelta: 'is ' },
      { type: 'text-delta', textDelta: 'crucial, ' },
      { type: 'text-delta', textDelta: 'providing ' },
      { type: 'text-delta', textDelta: 'funding ' },
      { type: 'text-delta', textDelta: 'for ' },
      { type: 'text-delta', textDelta: 'high-risk ' },
      { type: 'text-delta', textDelta: 'projects ' },
      { type: 'text-delta', textDelta: 'that ' },
      { type: 'text-delta', textDelta: 'drive ' },
      { type: 'text-delta', textDelta: 'technological ' },
      { type: 'text-delta', textDelta: 'advancements.\n\n' },
      { type: 'text-delta', textDelta: '### ' },
      { type: 'text-delta', textDelta: 'Networking ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'Collaboration\n' },
      { type: 'text-delta', textDelta: 'Collaboration ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'networking ' },
      { type: 'text-delta', textDelta: 'events ' },
      { type: 'text-delta', textDelta: 'foster ' },
      { type: 'text-delta', textDelta: 'connections ' },
      { type: 'text-delta', textDelta: 'among ' },
      { type: 'text-delta', textDelta: 'entrepreneurs ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'investors, ' },
      { type: 'text-delta', textDelta: 'creating ' },
      { type: 'text-delta', textDelta: 'a ' },
      { type: 'text-delta', textDelta: 'vibrant ' },
      { type: 'text-delta', textDelta: 'ecosystem ' },
      { type: 'text-delta', textDelta: 'for ' },
      { type: 'text-delta', textDelta: 'innovation.\n\n' },
      { type: 'text-delta', textDelta: '## ' },
      { type: 'text-delta', textDelta: 'Impact ' },
      { type: 'text-delta', textDelta: 'on ' },
      { type: 'text-delta', textDelta: 'Global ' },
      { type: 'text-delta', textDelta: 'Industries\n' },
      { type: 'text-delta', textDelta: '### ' },
      { type: 'text-delta', textDelta: 'Reshaping ' },
      { type: 'text-delta', textDelta: 'Sectors\n' },
      { type: 'text-delta', textDelta: 'The ' },
      { type: 'text-delta', textDelta: "region's " },
      { type: 'text-delta', textDelta: 'technological ' },
      { type: 'text-delta', textDelta: 'advancements ' },
      { type: 'text-delta', textDelta: 'are ' },
      { type: 'text-delta', textDelta: 'reshaping ' },
      { type: 'text-delta', textDelta: 'industries ' },
      { type: 'text-delta', textDelta: 'worldwide, ' },
      { type: 'text-delta', textDelta: 'influencing ' },
      { type: 'text-delta', textDelta: 'sectors ' },
      { type: 'text-delta', textDelta: 'like ' },
      { type: 'text-delta', textDelta: 'healthcare ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'transportation.\n\n' },
      { type: 'text-delta', textDelta: '### ' },
      { type: 'text-delta', textDelta: 'A ' },
      { type: 'text-delta', textDelta: 'Catalyst ' },
      { type: 'text-delta', textDelta: 'for ' },
      { type: 'text-delta', textDelta: 'Change\n' },
      { type: 'text-delta', textDelta: 'Silicon ' },
      { type: 'text-delta', textDelta: "Valley's " },
      { type: 'text-delta', textDelta: 'innovations ' },
      { type: 'text-delta', textDelta: 'serve ' },
      { type: 'text-delta', textDelta: 'as ' },
      { type: 'text-delta', textDelta: 'a ' },
      { type: 'text-delta', textDelta: 'catalyst ' },
      { type: 'text-delta', textDelta: 'for ' },
      { type: 'text-delta', textDelta: 'change, ' },
      { type: 'text-delta', textDelta: 'pushing ' },
      { type: 'text-delta', textDelta: 'boundaries ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'setting ' },
      { type: 'text-delta', textDelta: 'trends ' },
      { type: 'text-delta', textDelta: 'that ' },
      { type: 'text-delta', textDelta: 'resonate ' },
      { type: 'text-delta', textDelta: 'globally.\n\n' },
      { type: 'text-delta', textDelta: '## ' },
      { type: 'text-delta', textDelta: 'Challenges ' },
      { type: 'text-delta', textDelta: 'Facing ' },
      { type: 'text-delta', textDelta: 'Silicon ' },
      { type: 'text-delta', textDelta: 'Valley\n' },
      { type: 'text-delta', textDelta: '### ' },
      { type: 'text-delta', textDelta: 'High ' },
      { type: 'text-delta', textDelta: 'Living ' },
      { type: 'text-delta', textDelta: 'Costs\n' },
      { type: 'text-delta', textDelta: 'Despite ' },
      { type: 'text-delta', textDelta: 'its ' },
      { type: 'text-delta', textDelta: 'successes, ' },
      { type: 'text-delta', textDelta: 'challenges ' },
      { type: 'text-delta', textDelta: 'such ' },
      { type: 'text-delta', textDelta: 'as ' },
      { type: 'text-delta', textDelta: 'high ' },
      { type: 'text-delta', textDelta: 'living ' },
      { type: 'text-delta', textDelta: 'costs ' },
      { type: 'text-delta', textDelta: 'pose ' },
      { type: 'text-delta', textDelta: 'significant ' },
      { type: 'text-delta', textDelta: 'barriers ' },
      { type: 'text-delta', textDelta: 'for ' },
      { type: 'text-delta', textDelta: 'many ' },
      { type: 'text-delta', textDelta: 'residents ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'startups.\n\n' },
      { type: 'text-delta', textDelta: '### ' },
      { type: 'text-delta', textDelta: 'Ethical ' },
      { type: 'text-delta', textDelta: 'Concerns\n' },
      { type: 'text-delta', textDelta: 'Ethical ' },
      { type: 'text-delta', textDelta: 'concerns ' },
      { type: 'text-delta', textDelta: 'about ' },
      { type: 'text-delta', textDelta: 'technology, ' },
      { type: 'text-delta', textDelta: 'including ' },
      { type: 'text-delta', textDelta: 'privacy ' },
      { type: 'text-delta', textDelta: 'issues ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'the ' },
      { type: 'text-delta', textDelta: 'impact ' },
      { type: 'text-delta', textDelta: 'of ' },
      { type: 'text-delta', textDelta: 'automation, ' },
      { type: 'text-delta', textDelta: 'continue ' },
      { type: 'text-delta', textDelta: 'to ' },
      { type: 'text-delta', textDelta: 'spark ' },
      { type: 'text-delta', textDelta: 'debate ' },
      { type: 'text-delta', textDelta: 'within ' },
      { type: 'text-delta', textDelta: 'the ' },
      { type: 'text-delta', textDelta: 'community.\n\n' },
      { type: 'text-delta', textDelta: '## ' },
      { type: 'text-delta', textDelta: 'Conclusion\n' },
      { type: 'text-delta', textDelta: 'As ' },
      { type: 'text-delta', textDelta: 'Silicon ' },
      { type: 'text-delta', textDelta: 'Valley ' },
      { type: 'text-delta', textDelta: 'continues ' },
      { type: 'text-delta', textDelta: 'to ' },
      { type: 'text-delta', textDelta: 'evolve, ' },
      { type: 'text-delta', textDelta: 'it ' },
      { type: 'text-delta', textDelta: 'remains ' },
      { type: 'text-delta', textDelta: 'a ' },
      { type: 'text-delta', textDelta: 'key ' },
      { type: 'text-delta', textDelta: 'player ' },
      { type: 'text-delta', textDelta: 'in ' },
      { type: 'text-delta', textDelta: 'shaping ' },
      { type: 'text-delta', textDelta: 'the ' },
      { type: 'text-delta', textDelta: 'future ' },
      { type: 'text-delta', textDelta: 'of ' },
      { type: 'text-delta', textDelta: 'technology ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'society, ' },
      { type: 'text-delta', textDelta: 'navigating ' },
      { type: 'text-delta', textDelta: 'both ' },
      { type: 'text-delta', textDelta: 'its ' },
      { type: 'text-delta', textDelta: 'opportunities ' },
      { type: 'text-delta', textDelta: 'and ' },
      { type: 'text-delta', textDelta: 'challenges.' },
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
      { type: 'text-delta', textDelta: 'The ' },
      { type: 'text-delta', textDelta: 'current ' },
      { type: 'text-delta', textDelta: 'temperature ' },
      { type: 'text-delta', textDelta: 'in ' },
      { type: 'text-delta', textDelta: 'San ' },
      { type: 'text-delta', textDelta: 'Francisco ' },
      { type: 'text-delta', textDelta: 'is ' },
      { type: 'text-delta', textDelta: '17°C. ' },
      { type: 'text-delta', textDelta: 'If ' },
      { type: 'text-delta', textDelta: 'you ' },
      { type: 'text-delta', textDelta: 'need ' },
      { type: 'text-delta', textDelta: 'more ' },
      { type: 'text-delta', textDelta: 'details ' },
      { type: 'text-delta', textDelta: 'or ' },
      { type: 'text-delta', textDelta: 'a ' },
      { type: 'text-delta', textDelta: 'forecast, ' },
      { type: 'text-delta', textDelta: 'just ' },
      { type: 'text-delta', textDelta: 'let ' },
      { type: 'text-delta', textDelta: 'me ' },
      { type: 'text-delta', textDelta: 'know!' },
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
