import {
  type UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
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
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { readDocument } from '@/lib/ai/tools/read-document';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { getTools } from '@/lib/arcade/utils';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant' && lastMessage.parts.length > 0) {
      for (const part of lastMessage.parts) {
        if (
          part.type === 'tool-invocation' &&
          part.toolInvocation.state === 'result'
        ) {
          await saveMessages({
            messages: [
              {
                chatId: id,
                id: lastMessage.id,
                role: lastMessage.role,
                parts: lastMessage.parts,
                attachments: lastMessage.experimental_attachments ?? [],
                createdAt: new Date(),
              },
            ],
          });
        }
      }
    } else {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: userMessage.id,
            role: 'user',
            parts: userMessage.parts,
            attachments: userMessage.experimental_attachments ?? [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const arcadeTools = await getTools({ userId: session.user.id });

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages,
          maxSteps: 5,
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            ...arcadeTools,
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
            readDocument: readDocument({ session, dataStream }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                // When we use addToolResult, this generates a new assistant message, but we want to save it on the original message
                // Check if the message has a tool-invocation part
                const hasToolInvocation = assistantMessage?.parts?.some(
                  (part) =>
                    part.type === 'tool-invocation' &&
                    part.toolInvocation.state === 'call',
                );

                // If the message has a tool-invocation part, and the previous message has a tool-result part at the end, we need to save on the original message
                const lastMessageLastPart =
                  lastMessage.parts[lastMessage.parts.length - 1];
                if (
                  hasToolInvocation &&
                  lastMessage.role === 'assistant' &&
                  lastMessage.parts.length > 0 &&
                  lastMessageLastPart.type === 'tool-invocation' &&
                  lastMessageLastPart.toolInvocation.state === 'result'
                ) {
                  const toolInvocationPart = assistantMessage?.parts?.find(
                    (part) => part.type === 'tool-invocation',
                  );
                  if (!toolInvocationPart) {
                    return;
                  }
                  const parts = lastMessage.parts.concat(toolInvocationPart);
                  await saveMessages({
                    messages: [
                      {
                        id: lastMessage.id,
                        chatId: id,
                        role: lastMessage.role,
                        parts,
                        attachments: lastMessage.experimental_attachments ?? [],
                        createdAt: new Date(),
                      },
                    ],
                  });
                  return;
                }
                await saveMessages({
                  messages: [
                    {
                      id: assistantMessage.id,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (_) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
        console.error('Error:', error);
        return 'Oops, an error occured!';
      },
    });
  } catch (error) {
    console.error('Error in chat route', error);
    return new Response('An error occurred while processing your request!', {
      status: 404,
    });
  }
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
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
