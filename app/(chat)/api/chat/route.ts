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
import { searchKnowledgeToolAdapter } from '@/lib/knowledge/localFiles/searchToolAdapter';

export const maxDuration = 120; // Extended to ensure complex queries have enough time

export async function POST(request: Request) {
  try {
    // Parse JSON once and validate required fields
    const data = await request.json();
    const { id, messages, selectedChatModel } = data as { 
      id: string; 
      messages: Array<Message>; 
      selectedChatModel: string 
    };
    
    if (!id || !messages || !selectedChatModel) {
      console.error('Missing required fields in request');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' } 
      });
    }

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
            // First, try to find relevant knowledge for this message
            const searchTool = searchKnowledgeToolAdapter({
              session,
              dataStream,
              onChunksUsed: (chunks) => {
                usedKnowledgeChunks = chunks;
              },
            });

            // Search knowledge base with the user's message
            console.log('Searching knowledge base for relevant information');
            const knowledgeResults = await searchTool({
              query: userMessage.content.toString(),
              limit: 5,
            });

            console.log('Knowledge search results:', 
              knowledgeResults.count > 0 
                ? `Found ${knowledgeResults.count} relevant chunks` 
                : 'No relevant information found');

            // Now, invoke the chat model with enhanced context
            let enhancedMessages = [...messages];
            
            // If we found knowledge information, add it to the context
            if (knowledgeResults.count > 0) {
              // Add knowledge context more efficiently without creating unnecessary arrays
              const knowledgeSystemMsg = {
                id: generateUUID(),
                role: 'system',
                content: `I found the following relevant information in the user's knowledge base. Please use this information to answer their question:\n\n${knowledgeResults.relevantContent}\n\nYou MUST include and cite this information in your response, referring to the numbered sources.`
              };
              
              // Find optimal position to insert - just before the user message
              const userMsgIndex = enhancedMessages.findIndex(msg => msg.id === userMessage.id);
              
              if (userMsgIndex > 0) {
                // Insert at specific position without creating a full copy of the array
                enhancedMessages.splice(userMsgIndex, 0, knowledgeSystemMsg);
              } else {
                // If we can't find the user message or it's at position 0, insert at beginning
                enhancedMessages.unshift(knowledgeSystemMsg);
              }
              
              console.log(`Added knowledge context to messages with ${knowledgeResults.count} chunks`);
            } else {
              console.log('No knowledge context found, using regular messages');
            }
            
            const result = streamText({
              model: myProvider.languageModel(selectedChatModel),
              system: systemPrompt({ selectedChatModel }),
              messages: enhancedMessages,
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

                    // Prepare messages for saving with a more direct approach
                    const messagesToSave = sanitizedResponseMessages.map((message) => ({
                      id: message.id,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    }));
                    
                    // Save the messages
                    const savedMessages = await saveMessages({ messages: messagesToSave });

                    console.log(`Saved ${savedMessages.length} messages to chat ${id}`);

                    // Create knowledge references for the assistant message
                    if (usedKnowledgeChunks.length > 0) {
                      const assistantMessage = savedMessages.find(
                        (msg) => msg.role === 'assistant'
                      );
                      
                      if (assistantMessage) {
                        console.log(`Creating ${usedKnowledgeChunks.length} knowledge references for message ${assistantMessage.id}`);
                        
                        // Batch create knowledge references instead of individual calls
                        const referencePromises = usedKnowledgeChunks.map(chunk => 
                        createKnowledgeReference({
                        messageId: assistantMessage.id,
                          chunkId: chunk.id,
                          })
                      );
                      await Promise.all(referencePromises);
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
            console.error('Detailed error in stream processing:', error);
            dataStream.write(JSON.stringify({ error: 'An error occurred during processing' }));
      dataStream.close();
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
