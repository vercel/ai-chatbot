import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
} from 'ai';
import { AISDKExporter } from 'langsmith/vercel';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
  getMemoriesByUserId,
  getUserMemorySettings,
  getUploadedFilesByUrls,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import type { Chat } from '@/lib/db/schema';
import { differenceInSeconds } from 'date-fns';
import { ChatSDKError } from '@/lib/errors';
import { processMemoryForUser } from '@/lib/ai/memory-classifier';

export const maxDuration = 60;

// Removed complex provider switching - all files are now parsed as text

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (
        error.message.includes('REDIS_URL') ||
        error.code === 'ERR_INVALID_URL' ||
        error.message.includes('Invalid URL')
      ) {
        console.log(
          ' > Resumable streams are disabled due to invalid or missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  console.log('🔄 Chat API: Starting request processing...');

  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    console.log('📝 Chat API: Raw request data received:', {
      hasId: !!json.id,
      hasMessage: !!json.message,
      messagePartsLength: json.message?.parts?.length || 0,
      messageAttachmentsLength:
        json.message?.experimental_attachments?.length || 0,
      selectedChatModel: json.selectedChatModel,
      selectedVisibilityType: json.selectedVisibilityType,
    });

    requestBody = postRequestBodySchema.parse(json);
    console.log('✅ Chat API: Request body validation passed');
  } catch (error) {
    console.error('❌ Chat API: Request validation failed:', error);
    if (error instanceof Error) {
      console.error('❌ Chat API: Validation error details:', error.message);
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const { id, message, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const previousMessages = await getMessagesByChatId({ id });

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: message.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    // Get user memories and settings for context
    const [userMemories, userMemorySettings] = await Promise.all([
      getMemoriesByUserId({ userId: session.user.id, limit: 50 }), // Recent memories for context
      getUserMemorySettings({ userId: session.user.id }),
    ]);

    // Format memories for system prompt
    const memoriesContext =
      userMemories.length > 0
        ? userMemories
            .map((memory) => `[${memory.category}] ${memory.content}`)
            .join('\n- ')
        : undefined;

    // Get file context from attachments and prepare for AI model
    let attachedFilesContext: string | undefined;
    const fileAttachments: any[] = [];

    if (
      message.experimental_attachments &&
      message.experimental_attachments.length > 0
    ) {
      console.log('🔄 Processing file attachments for AI context...');

      try {
        const attachmentUrls = message.experimental_attachments.map(
          (att) => att.url,
        );
        const uploadedFiles = await getUploadedFilesByUrls({
          urls: attachmentUrls,
        });

        if (uploadedFiles.length > 0) {
          console.log(
            `📁 Found ${uploadedFiles.length} uploaded files for context`,
          );

          const fileContexts: string[] = [];

          for (const file of uploadedFiles) {
            const extension = file.fileName.split('.').pop()?.toLowerCase();

            // Find the corresponding attachment
            const attachment = message.experimental_attachments?.find(
              (att) => att.url === file.fileUrl,
            );

            if (file.parsedContent && file.parsingStatus === 'completed') {
              // For all parsed files (including PDFs), include content in context
              const content = file.parsedContent || '';
              const contentPreview =
                content.length > 500000
                  ? `${content.substring(0, 500000)}...\n[Content truncated - full ${content.length} characters available]`
                  : content;
              fileContexts.push(
                `📄 ${file.fileName} (${Math.round(file.fileSize / 1024)}KB):\n${contentPreview}`,
              );
            } else if (attachment?.contentType?.startsWith('image/')) {
              // Only add images as attachments since AI SDK handles them automatically
              fileAttachments.push({
                name: file.fileName,
                url: file.fileUrl,
                contentType: file.mimeType || attachment.contentType,
              });
              fileContexts.push(
                `🖼️ Image: ${file.fileName} (${Math.round(file.fileSize / 1024)}KB) - Available for visual analysis`,
              );
            }
          }

          if (fileContexts.length > 0) {
            attachedFilesContext = fileContexts.join(
              '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n',
            );
            console.log(
              `✅ Prepared context for ${fileContexts.length} files (${fileAttachments.length} as attachments)`,
            );
          }
        }
      } catch (error) {
        console.error('❌ Failed to process file attachments:', error);
      }
    }

    // Process memory collection in background (don't await)
    if (userMemorySettings?.memoryCollectionEnabled !== false) {
      // Extract text content from message parts for memory processing
      const messageText = message.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join(' ');

      if (messageText.trim()) {
        after(() =>
          processMemoryForUser(session.user.id, messageText, message.id).catch(
            (error) =>
              console.error('Background memory processing failed:', error),
          ),
        );
      }
    }

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    // All files are now parsed as text content, so no need for provider switching

    // Log context for debugging
    console.log('🤖 AI Context Summary:');
    console.log(`   - Memories: ${memoriesContext ? 'Yes' : 'No'}`);
    console.log(
      `   - Files: ${fileAttachments.length} attachments, ${attachedFilesContext ? 'Yes' : 'No'} context`,
    );
    console.log(
      `   - File context length: ${attachedFilesContext?.length || 0} chars`,
    );

    const stream = createDataStream({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({
            selectedChatModel,
            requestHints,
            memories: memoriesContext,
            attachedFiles: attachedFilesContext,
          }),
          messages,
          ...(fileAttachments.length > 0 && {
            experimental_attachments: fileAttachments,
          }),
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
                  messages: [message],
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
          experimental_telemetry: AISDKExporter.getSettings({
            runName: `chat-${selectedChatModel}`,
            metadata: {
              userId: session.user.id,
              chatId: id,
              userType: session.user.type,
              model: selectedChatModel,
              hasAttachments: fileAttachments.length > 0,
              attachmentCount: fileAttachments.length,
              attachmentFiles: fileAttachments
                .map((att) => att.name)
                .join(', '),
              hasFileContext: !!attachedFilesContext,
              fileContextLength: attachedFilesContext?.length || 0,
            },
          }),
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } else {
      return new Response(stream);
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}

export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  let chat: Chat;

  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const streamIds = await getStreamIdsByChatId({ chatId });

  if (!streamIds.length) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream,
  );

  /*
   * For when the generation is streaming during SSR
   * but the resumable stream has concluded at this point.
   */
  if (!stream) {
    const messages = await getMessagesByChatId({ id: chatId });
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: 'append-message',
          message: JSON.stringify(mostRecentMessage),
        });
      },
    });

    return new Response(restoredStream, { status: 200 });
  }

  return new Response(stream, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
