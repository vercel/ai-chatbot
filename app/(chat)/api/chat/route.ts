import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  createUser,
  getUser as getDbUser,
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
import { getUserProfile } from '@/lib/ai/tools/get-user-profile';
import { getUser } from '@civic/auth-web3/nextjs';
import { getTypedUser } from '@/lib/auth';
import { isProductionEnvironment } from '@/lib/constants';
import { NextResponse } from 'next/server';
import { myProvider } from '@/lib/ai/providers';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<Message>;
      selectedChatModel: string;
    } = await request.json();

    const user = await getTypedUser();

    if (!user || !user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Ensure the user exists in the database - with retries
    let dbUser = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!dbUser && retryCount < maxRetries) {
      try {
        // Check if user exists
        const users = await getDbUser(user.email);
        
        if (users && users.length > 0) {
          dbUser = users[0];
          console.log('Found existing user in DB:', dbUser.id);
        } else {
          // Create user if not exists
          console.log('Creating new user in DB from chat route:', user.id);
          await createUser({
            id: user.id,
            email: user.email,
          });
          
          // Verify user was created
          const verifyUsers = await getDbUser(user.email);
          if (verifyUsers && verifyUsers.length > 0) {
            dbUser = verifyUsers[0];
            console.log('Successfully created and verified user:', dbUser.id);
          } else {
            throw new Error('User creation succeeded but verification failed');
          }
        }
      } catch (error) {
        retryCount++;
        console.error(`Error creating user (attempt ${retryCount}/${maxRetries}):`, error);
        
        if (retryCount >= maxRetries) {
          return new Response(`Failed to create or verify user after ${maxRetries} attempts`, { 
            status: 500 
          });
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    try {
      const chat = await getChatById({ id });

      if (!chat) {
        const title = await generateTitleFromUserMessage({
          message: userMessage,
        });

        // Use the database user ID instead of the auth user ID
        const userId = dbUser?.id || user.id;
        console.log('Creating new chat with userId:', userId);
        await saveChat({ id, userId, title });
      } else {
        if (chat.userId !== user.id && chat.userId !== dbUser?.id) {
          return new Response('Unauthorized', { status: 401 });
        }
      }

      await saveMessages({
        messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
      });
    } catch (error) {
      console.error('Error saving chat or messages:', error);
      return new Response('Failed to save chat or messages', { status: 500 });
    }

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                  'getUserProfile',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ user, dataStream }),
            updateDocument: updateDocument({ user, dataStream }),
            requestSuggestions: requestSuggestions({
              user,
              dataStream,
            }),
            getUserProfile: getUserProfile({
              user,
              dataStream,
            }),
          },
          onFinish: async ({ response, reasoning }) => {
            if (user?.id) {
              try {
                const sanitizedResponseMessages = sanitizeResponseMessages({
                  messages: response.messages,
                  reasoning,
                });

                await saveMessages({
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
              } catch (error) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
        console.error('Failed to stream text', error);
        return 'Oops, an error occured!';
      },
    });
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const user = await getUser();

  if (!user || !user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== user.id) {
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
