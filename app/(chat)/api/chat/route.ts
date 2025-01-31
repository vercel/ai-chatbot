import {
  type Message,
  createDataStreamResponse,
  formatDataStreamPart,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';

export const maxDuration = 60;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];
const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  await saveMessages({
    messages: [
      { ...userMessage, reasoning: null, createdAt: new Date(), chatId: id },
    ],
  });

  return createDataStreamResponse({
    execute: (dataStream) => {
      // Some arbitrary buffer limit
      const MAX_REASONING_LENGTH = 250;
      let reasoningBuffer = '';
      let fullReasoning = '';
      let isProcessingReasoning = false;
      const reasoningQueue: string[] = [];

      async function processReasoningQueue() {
        if (reasoningQueue.length === 0 || isProcessingReasoning) {
          return;
        }

        isProcessingReasoning = true;
        const text = reasoningQueue.shift() ?? '';

        try {
          const { fullStream } = streamText({
            model: customModel('gpt-4o-mini', 'openai'),
            system: `You are tasked with generating a concise summary and title explaining the topic and some details of a line of reasoning. Your goal is to capture the essence of the explanation in a brief, clear manner.

Here some examples to guide you:

## Example
User: Okay, the user is asking, "How far is the sun from the moon." Let me start by recalling the basic astronomy here. The Sun and the Moon are two celestial bodies, but their distance from each other isn't a fixed number because both are orbiting different points. The Earth orbits the Sun, and the Moon orbits the Earth.
Assistant:
# Recalling the basics of astronomy
The Sun and the Moon are both celestial bodies, but their distance from each other changes because they orbit different points: the Earth orbits the Sun, and the Moon orbits the Earth.

# Instructions
Based on the partial thought process provided, generate a short summary of approximately 40 words or less in markdown format. Begin with a title of 10 words or less with the perspective of the thought process, followed by a brief description of the thinking presented in the explanation.
Ensure that your summary captures the key points of the thinking concisely and accurately.

# Response format
Please provide your response in markdown format as an h3 header followed by a paragraph.
`,
            messages: [
              {
                role: 'user',
                content: text,
              },
            ],
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
          });

          const streamToReasoning = fullStream.pipeThrough(
            new TransformStream({
              transform(chunk, controller) {
                if (chunk.type === 'text-delta') {
                  const reasoningChunk = formatDataStreamPart(
                    'reasoning',
                    chunk.textDelta,
                  );
                  fullReasoning += chunk.textDelta;

                  controller.enqueue(reasoningChunk);
                } else {
                  // add lines to the end of each point
                  controller.enqueue(formatDataStreamPart('reasoning', '\n\n'));
                }
              },
            }),
          );

          // Wait for the stream to complete before processing next item
          await dataStream.merge(streamToReasoning);
        } finally {
          isProcessingReasoning = false;
          // Process next item in queue if any
          processReasoningQueue();
        }
      }

      async function summarizeReasoning(text: string) {
        reasoningQueue.push(text);
        processReasoningQueue();
      }

      const result = streamText({
        model: customModel(model.apiIdentifier, model.provider),
        system: systemPrompt,
        messages,
        maxSteps: 5,
        experimental_activeTools: allTools,
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
          createDocument: createDocument({ session, dataStream, model }),
          updateDocument: updateDocument({ session, dataStream, model }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
            model,
          }),
        },
        onChunk: async (chunk) => {
          if (chunk.chunk.type !== 'reasoning') {
            return;
          }

          const { type, textDelta } = chunk.chunk || {};

          // Only buffer "reasoning" type chunks
          if (type === 'reasoning') {
            reasoningBuffer += textDelta;

            // Heuristic #1: if buffer is too long, summarize now
            if (reasoningBuffer.length >= MAX_REASONING_LENGTH) {
              summarizeReasoning(reasoningBuffer);
              reasoningBuffer = ''; // reset
            }

            // Heuristic #2: if we detect a paragraph boundary
            if (/[.?!](\s|\n\n)*$/.test(reasoningBuffer)) {
              summarizeReasoning(reasoningBuffer);
              reasoningBuffer = '';
            }
          }

          // Handle other chunk types as you already do
        },
        onFinish: async ({ response }) => {
          if (session.user?.id) {
            try {
              const responseMessagesWithoutIncompleteToolCalls =
                sanitizeResponseMessages(response.messages);

              await saveMessages({
                messages: responseMessagesWithoutIncompleteToolCalls.map(
                  (message) => {
                    return {
                      id: message.id,
                      chatId: id,
                      reasoning: fullReasoning,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    };
                  },
                ),
              });
            } catch (error) {
              console.error('Failed to save chat');
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: false,
      });
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
