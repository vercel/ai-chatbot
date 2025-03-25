import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { myProvider } from '@/lib/ai/models';
import { systemPrompt, enhancedKnowledgeSystemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  createKnowledgeReference,
  createBulkKnowledgeReferences,
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
                // Create a more explicit instruction for using knowledge
                const knowledgeSystemMsg = {
                  id: generateUUID(),
                  role: 'system',
                  content: enhancedKnowledgeSystemPrompt + knowledgeResults.relevantContent
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
                    
                    // Extract the assistant message from the response
                    const assistantMessage = response.messages.find(msg => msg.role === 'assistant');
                    if (!assistantMessage) {
                      console.error('No assistant message found in response');
                      return;
                    }
                    console.log(`Found assistant message with ID: ${assistantMessage.id}`);
                    
                    const sanitizedResponseMessages = sanitizeResponseMessages({
                      messages: response.messages,
                      reasoning,
                    });

                    // Check that we still have the assistant message after sanitization
                    const sanitizedAssistantMessage = sanitizedResponseMessages.find(msg => msg.id === assistantMessage.id);
                    if (!sanitizedAssistantMessage) {
                      console.error('Assistant message was lost during sanitization');
                      return;
                    }

                    // Prepare messages for saving with a more direct approach
                    const messagesToSave = sanitizedResponseMessages.map((message) => ({
                      id: message.id,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    }));
                    
                    console.log(`Attempting to save ${messagesToSave.length} messages to database`);
                    // Save the messages
                    const savedMessages = await saveMessages({ messages: messagesToSave });

                    console.log(`Saved ${savedMessages.length} messages to chat ${id}`);
                    
                    // Verify saved messages actually have our assistant message
                    const savedAssistantMessage = savedMessages.find(
                      (msg) => msg.id === assistantMessage.id
                    );
                    
                    if (!savedAssistantMessage) {
                      console.error(`Assistant message with ID ${assistantMessage.id} failed to save properly. Available messages:`, 
                        savedMessages.map(m => ({ id: m.id, role: m.role }))
                      );
                      return;
                    }
                    // Create knowledge references for the assistant message
                    if (usedKnowledgeChunks.length > 0 && savedAssistantMessage) {
                        
                      console.log(`Creating ${usedKnowledgeChunks.length} knowledge references for message ${savedAssistantMessage.id}`);
                        try {
                          // Start a database transaction to ensure atomicity
                          console.log('Beginning transaction for reference creation');
                          
                          // Create an array of reference objects to insert
                          const referenceObjects = usedKnowledgeChunks
                            .filter(chunk => chunk.id) // Ensure chunk has ID
                            .map(chunk => ({
                              messageId: savedAssistantMessage.id,
                              chunkId: chunk.id,
                              createdAt: new Date()
                            }));
                          
                          if (referenceObjects.length > 0) {
                            // Use bulk insert to create all references at once
                            console.log(`Attempting to create ${referenceObjects.length} references in bulk`);
                            
                            // Execute our improved createReferences function
                            const insertedCount = await createBulkKnowledgeReferences(referenceObjects);
                            
                            console.log(`Successfully created ${insertedCount} knowledge references`);
                          } else {
                            console.log('No valid knowledge chunks to reference');
                          }
                        } catch (referenceError) {
                          console.error('Error creating knowledge references:', referenceError);
                        }
                      } else {
                        console.log('No knowledge chunks used or no assistant message found, skipping reference creation');
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
