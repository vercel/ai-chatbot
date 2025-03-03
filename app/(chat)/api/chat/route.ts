import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { myProvider } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  createKnowledgeReference,
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
import { searchKnowledge } from '@/lib/ai/tools/search-knowledge';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: { id: string; messages: Array<Message>; selectedChatModel: string } =
      await request.json();

    console.log(`Chat API called - Chat ID: ${id}, Model: ${selectedChatModel}`);
    
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.error('Unauthorized access attempt to chat API');
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      console.error('No user message found in request');
      return new Response('No user message found', { status: 400 });
    }

    console.log(`Processing message from user ${session.user.id}: "${userMessage.content.substring(0, 50)}..."`);

    const chat = await getChatById({ id });

    if (!chat) {
      console.log(`Creating new chat with ID: ${id}`);
      const title = await generateTitleFromUserMessage({ message: userMessage });
      await saveChat({ id, userId: session.user.id, title });
    }

    await saveMessages({
      messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
    });

    // Track knowledge chunks used for this message
    let usedKnowledgeChunks: Array<{ id: string; content: string }> = [];

    return createDataStreamResponse({
      execute: async (dataStream) => {
        try {
          console.log(`Streaming response for chat ${id} using model ${selectedChatModel}`);
          
          try {
            // Temporarily disable tools to work around Zod schema issue
            console.log("Using chat model without tools to work around schema issues");
            const result = streamText({
              model: myProvider.languageModel(selectedChatModel),
              system: systemPrompt({ selectedChatModel }),
              messages,
              maxSteps: 5,
              experimental_transform: smoothStream({ chunking: 'word' }),
              experimental_generateMessageId: generateUUID,
              onFinish: async ({ response, reasoning }) => {
                if (session.user?.id) {
                  try {
                    console.log(`Finalizing response for chat ${id}`);
                    
                    const sanitizedResponseMessages = sanitizeResponseMessages({
                      messages: response.messages,
                      reasoning,
                    });

                    // Save the messages
                    const savedMessages = await saveMessages({
                      messages: sanitizedResponseMessages.map((message) => {
                        return {
                          id: message.id,
                          chatId: id,
                          role: message.role,
                          content: message.content,
                          createdAt: new Date(),
                        };
                      }),
                    });

                    console.log(`Saved ${savedMessages.length} messages to chat ${id}`);

                    // Create knowledge references for the assistant message
                    if (usedKnowledgeChunks.length > 0) {
                      const assistantMessage = savedMessages.find(
                        (msg) => msg.role === 'assistant'
                      );
                      
                      if (assistantMessage) {
                        console.log(`Creating ${usedKnowledgeChunks.length} knowledge references for message ${assistantMessage.id}`);
                        
                        for (const chunk of usedKnowledgeChunks) {
                          await createKnowledgeReference({
                            messageId: assistantMessage.id,
                            chunkId: chunk.id,
                          });
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Failed to save chat or create references:', error);
                  }
                }
              },
              experimental_telemetry: {
                isEnabled: true,
                functionId: 'stream-text',
              },
            });

            result.consumeStream();

            result.mergeIntoDataStream(dataStream, {
              sendReasoning: true,
            });
          } catch (error) {
            console.error('Error in stream processing:', error);
            dataStream.close();
            throw error;
          }
        } catch (error) {
          console.error('Error in stream processing:', error);
          dataStream.close();
          throw error;
        }
      },
      onError: (error) => {
        console.error('Chat API stream error:', error);
        return `An error occurred: ${error.message || 'Unknown error'}. Please try again.`;
      },
    });
  } catch (error) {
    console.error('Unhandled error in chat API:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
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
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
