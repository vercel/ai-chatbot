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
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/artifacts/create-document';
import { updateDocument } from '@/lib/ai/tools/artifacts/update-document';
import { requestSuggestions } from '@/lib/ai/tools/artifacts/request-suggestions';
import { getWeather } from '@/lib/ai/tools/default/get-weather';
import { getCompanyProfile } from '@/lib/ai/tools/custom/get-company-profile';
import { 
  exaSearch, 
  exaSearchAndContents, 
  exaFindSimilar,
  exaGetContents,
  exaAnswer 
} from '@/lib/ai/tools/default/exa-search';

// Maximum duration for the API route execution in seconds
export const maxDuration = 60;

/**
 * POST handler for the chat API endpoint
 * Handles new message submissions and AI responses
 */
export async function POST(request: Request) {
  // Extract chat data from the request body
  const {
    id,          // Unique identifier for the chat session
    messages,    // Array of chat messages
    selectedChatModel, // The AI model selected for this chat
  }: { id: string; messages: Array<Message>; selectedChatModel: string } =
    await request.json();

  // Verify user authentication
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get the most recent user message for processing
  const userMessage = getMostRecentUserMessage(messages);
  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  // Create or retrieve chat session
  const chat = await getChatById({ id });
  if (!chat) {
    // Generate a title for new chat sessions based on the first message
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  // Save the user's message to the database
  await saveMessages({
    messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
  });

  // Create and return a streaming response
  return createDataStreamResponse({
    execute: (dataStream) => {
      // Configure and initiate the AI text stream
      const result = streamText({
        // Select the AI model based on user preference
        model: myProvider.languageModel(selectedChatModel),
        // Set the system prompt for the AI
        system: systemPrompt({ selectedChatModel }),
        messages,
        maxSteps: 5,
        // Configure available AI tools based on the model
        experimental_activeTools:
          selectedChatModel === 'chat-model-reasoning'
            ? []  // No tools for reasoning model
            : [   // Standard tools for other models
                'getWeather',
                'createDocument',
                'updateDocument',
                'requestSuggestions',
                'getCompanyProfile',
                'exaSearch',
                'exaSearchAndContents',
                'exaFindSimilar',
                'exaGetContents',
                'exaAnswer'
              ],
        // Configure stream processing
        experimental_transform: smoothStream({ chunking: 'word' }), // Word-by-word streaming
        experimental_generateMessageId: generateUUID,  // Unique ID for each message
        
        // Tool definitions with access to session and dataStream
        tools: {
          getWeather, // Weather information tool
          createDocument: createDocument({ session, dataStream }), // Document creation tool
          updateDocument: updateDocument({ session, dataStream }), // Document update tool
          requestSuggestions: requestSuggestions({  // Suggestions tool
            session,
            dataStream,
          }),
          getCompanyProfile, // Five Elms company profile tool
          exaSearch,
          exaSearchAndContents,
          exaFindSimilar,
          exaGetContents,
          exaAnswer
        },

        // Handle stream completion
        onFinish: async ({ response, reasoning }) => {
          if (session.user?.id) {
            try {
              // Clean and prepare messages for storage
              const sanitizedResponseMessages = sanitizeResponseMessages({
                messages: response.messages,
                reasoning,
              });

              // Save AI responses to the database
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

        // Enable telemetry for monitoring
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      // Process and merge the stream
      result.consumeStream();
      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true, // Include AI reasoning in the response
      });
    },
    onError: () => {
      return 'Oops, an error occured!';
    },
  });
}

/**
 * DELETE handler for the chat API endpoint
 * Handles chat deletion requests
 */
export async function DELETE(request: Request) {
  // Extract chat ID from URL parameters
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  // Verify user authentication
  const session = await auth();
  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Verify chat ownership
    const chat = await getChatById({ id });
    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Delete the chat
    await deleteChatById({ id });
    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
