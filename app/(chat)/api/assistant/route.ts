import { AssistantResponse } from 'ai';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

import { saveChat, saveMessages } from '@/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage, saveChatId } from '../../actions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Parse the request body
  const input: {
    threadId: string | null;
    message: string;
  } = await req.json();

  // Create a thread if needed
  const threadId = input.threadId
    ? input.threadId
    : (await openai.beta.threads.create({})).id;

  // Add a message to the thread
  console.log(threadId, 'threadId');
  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: input.message,
  });

  if (!input.threadId) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user')?.value ?? '';

    const title = await generateTitleFromUserMessage({
      message: createdMessage as any,
    });
    await saveChat({ id: threadId, userId: userId, title });
    await saveChatId(threadId);
  }

  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ forwardStream, sendDataMessage }) => {
      // Run the assistant on the thread
      const runStream = openai.beta.threads.runs.stream(threadId, {
        assistant_id:
          process.env.OPENAI_ASSISTANT_ID ??
          (() => {
            throw new Error('OPENAI_ASSISTANT_ID is not set');
          })(),
      });

      // forward run status would stream message deltas
      let runResult = await forwardStream(runStream);

      // status can be: queued, in_progress, requires_action, cancelling, cancelled, failed, completed, or expired
      while (
        runResult?.status === 'requires_action' &&
        runResult.required_action?.type === 'submit_tool_outputs'
      ) {
        const tool_outputs =
          runResult.required_action.submit_tool_outputs.tool_calls.map(
            (toolCall: any) => {
              const parameters = JSON.parse(toolCall.function.arguments);

              switch (toolCall.function.name) {
                // configure your tool calls here

                default:
                  throw new Error(
                    `Unknown tool call function: ${toolCall.function.name}`
                  );
              }
            }
          );

        runResult = await forwardStream(
          openai.beta.threads.runs.submitToolOutputsStream(
            threadId,
            runResult.id,
            { tool_outputs }
          )
        );
      }
      if (runResult?.status === 'completed') {
        try {
          const messages = await openai.beta.threads.messages.list(threadId);

          console.log(messages);
          const responseMessagesWithoutIncompleteToolCalls =
            sanitizeResponseMessages(messages.data as any);

          console.log({ responseMessagesWithoutIncompleteToolCalls });

          await saveMessages({
            messages: responseMessagesWithoutIncompleteToolCalls.map(
              (message) => {
                const messageId = generateUUID();

                return {
                  id: messageId,
                  chatId: threadId,
                  role: message.role,
                  content: (message.content[0] as any).text.value,
                  createdAt: new Date(),
                };
              }
            ),
          });
        } catch (error) {
          console.error('Failed to save chat');
        }
      }
    }
  );
}
