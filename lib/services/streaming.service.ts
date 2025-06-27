import { createDataStream, smoothStream, streamText } from 'ai';
import { after } from 'next/server';
import { differenceInSeconds } from 'date-fns';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { systemPrompt } from '@/lib/ai/prompts';
import { myProvider } from '@/lib/ai/providers';
import { generateUUID } from '@/lib/utils';
import { isProductionEnvironment } from '@/lib/constants';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { getChart } from '@/lib/ai/tools/get-chart';
import { snowflakeSqlTool } from '@/lib/ai/tools/snowflake-sql-runner';
import { mcpTools } from '@/lib/ai/mcp-tools';
import type { ChatContext } from './chat.service';
import type { PostRequestBody } from '@/app/(chat)/api/chat/schema';
import { inspectContributorDataTool } from '../ai/tools/inspect-contributor';

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext(): ResumableStreamContext | null {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export function createAIStream(
  requestBody: PostRequestBody,
  context: ChatContext,
): ReadableStream {
  const { selectedChatModel, message } = requestBody;
  const { chatId, user, messages, requestHints } = context;

  return createDataStream({
    execute: (dataStream) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: systemPrompt({ selectedChatModel, requestHints }),
        messages,
        maxSteps: 5,
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
          getChart,
          createDocument: createDocument({
            session: { user: { id: user.id, type: user.type }, expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
            dataStream,
            chatId,
          }),
          updateDocument: updateDocument({
            session: { user: { id: user.id, type: user.type }, expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
            dataStream,
          }),
          requestSuggestions: requestSuggestions({
            session: { user: { id: user.id, type: user.type }, expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
            dataStream,
          }),
          snowflakeSqlTool,
          inspectContributorDataTool,
          ...mcpTools,
        },
        onFinish: async ({ response }) => {
          if (user?.id) {
            try {
              const { saveAssistantMessage } = await import('./chat.service');
              await saveAssistantMessage(chatId, message, response.messages);
            } catch (error) {
              console.error('Failed to save chat:', error);
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
      return 'Oops, an error occurred!';
    },
  });
}

export async function createResumableResponse(
  streamId: string,
  stream: ReadableStream,
): Promise<Response> {
  const streamContext = getStreamContext();

  if (streamContext) {
    return new Response(
      await streamContext.resumableStream(streamId, () => stream),
    );
  } else {
    return new Response(stream);
  }
}

export async function resumeStream(
  streamId: string,
): Promise<ReadableStream | null> {
  const streamContext = getStreamContext();

  if (!streamContext) {
    return null;
  }

  const emptyDataStream = createDataStream({
    execute: () => { },
  });

  return await streamContext.resumableStream(streamId, () => emptyDataStream);
}

export function createRestoredStream(message: any): ReadableStream {
  return createDataStream({
    execute: (buffer) => {
      buffer.writeData({
        type: 'append-message',
        message: JSON.stringify(message),
      });
    },
  });
}

export function createEmptyStream(): ReadableStream {
  return createDataStream({
    execute: () => { },
  });
}

export function shouldRestoreMessage(
  message: any,
  resumeRequestedAt: Date,
): boolean {
  if (!message || message.role !== 'assistant') {
    return false;
  }

  const messageCreatedAt = new Date(message.createdAt);
  return differenceInSeconds(resumeRequestedAt, messageCreatedAt) <= 15;
}
