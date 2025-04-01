import {
  UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
  experimental_createMCPClient,
} from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  getEnabledMcpServersByUserId,
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
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';

export const maxDuration = 60;

export async function POST(request: Request) {
  let mcpClientsToClose: Awaited<ReturnType<typeof experimental_createMCPClient>>[] = [];

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
    const userId = session.user.id;

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: userId, title });
    } else {
      if (chat.userId !== userId) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

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

    return createDataStreamResponse({
      execute: async (dataStream) => {
        try {
          const staticTools = {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          };
          let combinedTools: Record<string, any> = { ...staticTools };

          try {
            const enabledServers = await getEnabledMcpServersByUserId({ userId });

            for (const server of enabledServers) {
              try {
                let transport;
                const config = server.config as any;

                if (config.transportType === 'sse') {
                  transport = {
                    type: 'sse' as const,
                    url: config.url,
                  };
                } else if (config.transportType === 'stdio') {
                   if (isProductionEnvironment) {
                      console.warn(`SECURITY WARNING: Initializing MCP client with stdio transport in production for server: ${server.name} (ID: ${server.id})`);
                   }
                  transport = new Experimental_StdioMCPTransport({
                    command: config.command,
                    args: config.args || [],
                  });
                } else {
                    console.warn(`Unsupported MCP transport type '${config.transportType}' for server ${server.name}`);
                    continue;
                }

                const mcpClient = await experimental_createMCPClient({ transport });
                mcpClientsToClose.push(mcpClient);

                const mcpTools = await mcpClient.tools();
                combinedTools = { ...combinedTools, ...mcpTools };
                console.log(`Loaded ${Object.keys(mcpTools).length} tools from MCP server: ${server.name}`);

              } catch (mcpError) {
                console.error(`Failed to initialize or get tools from MCP server ${server.name} (ID: ${server.id}):`, mcpError);
              }
            }
          } catch (dbError) {
             console.error('Failed to fetch enabled MCP servers:', dbError);
          }

          const activeToolsList = selectedChatModel === 'chat-model-reasoning'
              ? []
              : Object.keys(combinedTools);

          const result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: systemPrompt({ selectedChatModel }),
            messages,
            maxSteps: 5,
            tools: combinedTools,
            experimental_activeTools: activeToolsList,
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
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

                  await saveMessages({
                    messages: [
                      {
                        id: assistantId,
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
                  console.error('Failed to save chat messages after stream completion');
                }
              }
              console.log(`Closing ${mcpClientsToClose.length} MCP clients in onFinish...`);
              for (const client of mcpClientsToClose) {
                 try {
                     await client.close();
                 } catch (closeError: unknown) {
                     console.error('Error closing MCP client in onFinish:', closeError);
                 }
              }
              mcpClientsToClose = [];
            },
            experimental_telemetry: {
              isEnabled: isProductionEnvironment,
              functionId: 'stream-text',
            },
          });

          result.consumeStream();
          result.mergeIntoDataStream(dataStream, { sendReasoning: true });

        } catch(streamError) {
            console.error('Error during streamText execution or MCP setup:', streamError);
            throw streamError;
        } finally {
             console.log('Stream execute try/catch finished.');
        }
      },
      onError: (error) => {
          console.error('Data stream error:', error);
          return 'Oops, an error occured!';
      },
    });
  } catch (error) {
      console.error('Error in POST /api/chat route (initial setup):', error);
      for (const client of mcpClientsToClose) {
          client.close().catch((closeError: unknown) => console.error('Error closing MCP client during outer catch:', closeError));
      }
    return new Response('An error occurred while processing your request!', {
      status: 500,
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
    console.error('Error deleting chat:', error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
