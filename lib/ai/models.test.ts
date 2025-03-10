import { compareMessages } from '@/tests/prompts/utils';
import { CoreMessage, FinishReason, simulateReadableStream } from 'ai';
import { MockLanguageModelV1 } from 'ai/test';

interface TextDeltaChunk {
  type: 'text-delta';
  textDelta: string;
}

interface ReasoningChunk {
  type: 'reasoning';
  textDelta: string;
}

interface ToolCallChunk {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: any;
}

interface FinishChunk {
  type: 'finish';
  finishReason: FinishReason;
  logprobs: undefined;
  usage: { completionTokens: number; promptTokens: number };
}

type Chunk = TextDeltaChunk | ReasoningChunk | ToolCallChunk | FinishChunk;

const getResponseChunksByPrompt = (
  prompt: CoreMessage[],
  isReasoningEnabled: boolean = false,
): Array<Chunk> => {
  const recentMessage = prompt.at(-1);

  if (!recentMessage) {
    throw new Error('No recent message found!');
  }

  if (isReasoningEnabled) {
    if (
      compareMessages(recentMessage, {
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
      compareMessages(recentMessage, {
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
    compareMessages(recentMessage, {
      role: 'user',
      content: [{ type: 'text', text: 'thanks!' }],
    })
  ) {
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
  } else if (
    compareMessages(recentMessage, {
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
    compareMessages(recentMessage, {
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
    compareMessages(recentMessage, {
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
    compareMessages(recentMessage, {
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
  } else if (
    compareMessages(recentMessage, {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'help me write a haiku about noe valley',
        },
      ],
    })
  ) {
    return [
      {
        type: 'tool-call',
        toolCallId: 'call_123',
        toolName: 'createDocument',
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
    compareMessages(recentMessage, {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Haiku about Noe Valley',
        },
      ],
    })
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
    compareMessages(recentMessage, {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: 'call_123',
          toolName: 'createDocument',
          result: {
            id: '3ca386a4-40c6-4630-8ed1-84cbd46cc7eb',
            title: 'Haiku about Noe Valley',
            kind: 'text',
            content: 'A document was created and is now visible to the user.',
          },
        },
      ],
    })
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
  } else if (
    compareMessages(recentMessage, {
      role: 'user',
      content: [
        {
          type: 'text',
          text: "what's the weather in sf?",
        },
      ],
    })
  ) {
    return [
      {
        type: 'tool-call',
        toolCallId: 'call_456',
        toolName: 'getWeather',
        args: JSON.stringify({ latitude: 37.7749, longitude: -122.4194 }),
      },
      {
        type: 'finish',
        finishReason: 'stop',
        logprobs: undefined,
        usage: { completionTokens: 10, promptTokens: 3 },
      },
    ];
  } else if (
    compareMessages(recentMessage, {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: 'call_456',
          toolName: 'getWeather',
          result: {
            latitude: 37.763283,
            longitude: -122.41286,
            generationtime_ms: 0.06449222564697266,
            utc_offset_seconds: -25200,
            timezone: 'America/Los_Angeles',
            timezone_abbreviation: 'GMT-7',
            elevation: 18,
            current_units: {
              time: 'iso8601',
              interval: 'seconds',
              temperature_2m: '°C',
            },
            current: {
              time: '2025-03-10T14:00',
              interval: 900,
              temperature_2m: 17,
            },
            daily_units: {
              time: 'iso8601',
              sunrise: 'iso8601',
              sunset: 'iso8601',
            },
            daily: {
              time: [
                '2025-03-10',
                '2025-03-11',
                '2025-03-12',
                '2025-03-13',
                '2025-03-14',
                '2025-03-15',
                '2025-03-16',
              ],
              sunrise: [
                '2025-03-10T07:27',
                '2025-03-11T07:25',
                '2025-03-12T07:24',
                '2025-03-13T07:22',
                '2025-03-14T07:21',
                '2025-03-15T07:19',
                '2025-03-16T07:18',
              ],
              sunset: [
                '2025-03-10T19:12',
                '2025-03-11T19:13',
                '2025-03-12T19:14',
                '2025-03-13T19:15',
                '2025-03-14T19:16',
                '2025-03-15T19:17',
                '2025-03-16T19:17',
              ],
            },
          },
        },
      ],
    })
  ) {
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
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunks: getResponseChunksByPrompt(prompt),
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});
