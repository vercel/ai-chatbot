import {
  UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { NextRequest, NextResponse } from 'next/server';
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
import { generateTitleFromUserMessage } from '@/app/notebook/actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';

export const maxDuration = 60;

// Define what the notebook context should look like
interface NotebookContext {
  blockId: string;
  blockType: 'markdown' | 'python' | 'csv';
  notebookId: string;
}

// POST /api/chat - Unified chat API that handles both notebook-specific requests
// and general chat requests with authentication
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { id, selectedChatModel } = json;
    let { messages } = json;
    const notebookContext = json.notebookContext as NotebookContext | undefined;
    
    // If this is a notebook context request, modify the system message and forward
    // to the appropriate endpoint
    if (notebookContext) {
      let systemMessage = "You are a helpful AI assistant.";
      
      // Add block-specific context to the system message
      switch (notebookContext.blockType) {
        case 'markdown':
          systemMessage = "You are a helpful AI assistant specialized in markdown formatting and text improvement. Help the user enhance their markdown content.";
          break;
        case 'python':
          systemMessage = "You are a helpful AI assistant specialized in Python programming. Help the user analyze, debug, and improve their Python code.";
          break;
        case 'csv':
          systemMessage = "You are a helpful AI assistant specialized in data analysis. Help the user understand, clean, and visualize their CSV data.";
          break;
      }

      // Check if there's already a system message, and update or add one
      const hasSystemMessage = messages.some(
        (message: any) => message.role === 'system'
      );

      if (hasSystemMessage) {
        // Update existing system message
        messages = messages.map((message: any) => {
          if (message.role === 'system') {
            return { ...message, content: systemMessage };
          }
          return message;
        });
      } else {
        // Add a new system message at the beginning
        messages = [{ role: 'system', content: systemMessage }, ...messages];
      }
      
      // For notebook context, we use a simplified API flow without authentication
      const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:3000/api/ai";
      
      // Forward the request to the AI API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          id: id || generateUUID(),
          selectedChatModel,
        }),
      });

      // Check if the AI API returned an error
      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json(
          { error: 'AI service error', details: errorData },
          { status: response.status }
        );
      }

      // Return the AI API response
      const data = await response.json();
      return NextResponse.json(data);
    } 
    // Otherwise, handle as a regular authenticated chat request
    else {
      const session = await auth();

      if (!session || !session.user || !session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userMessage = getMostRecentUserMessage(messages);

      if (!userMessage) {
        return NextResponse.json(
          { error: 'No user message found' },
          { status: 400 }
        );
      }

      const chat = await getChatById({ id });

      if (!chat) {
        const title = await generateTitleFromUserMessage({
          message: userMessage,
        });

        await saveChat({ id, userId: session.user.id, title });
      } else {
        if (chat.userId !== session.user.id) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
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
                  ],
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
            tools: {
              getWeather,
              createDocument: createDocument({ session, dataStream }),
              updateDocument: updateDocument({ session, dataStream }),
              requestSuggestions: requestSuggestions({
                session,
                dataStream,
              }),
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
        onError: () => {
          return 'Oops, an error occured!';
        },
      });
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }

  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await deleteChatById({ id });

    return NextResponse.json(
      { message: 'Chat deleted' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred while processing your request!' },
      { status: 500 }
    );
  }
} 