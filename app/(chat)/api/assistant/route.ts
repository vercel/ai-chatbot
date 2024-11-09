import { AssistantResponse } from 'ai';
import { cookies } from 'next/headers';
import { default as OpenAI } from 'openai';

import { saveChat, saveMessages } from '@/db/queries';
import { generateUUID, sanitizeResponseMessages } from '@/lib/utils';

import {
  generateTitleFromUserMessage,
  saveChatId,
} from '../../../chat/actions';
import { MessageCreateParams } from 'openai/resources/beta/threads/messages.mjs';

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
    data: {
      attachments: string;
    };
  } = await req.json();
  console.log(input, 'input');

  // Create a thread if needed
  const threadId = input.threadId
    ? input.threadId
    : (await openai.beta.threads.create({})).id;

  const userMessage: MessageCreateParams = {
    role: 'user',
    content: [{ type: 'text', text: input.message }],
  };

  if (input.data.attachments && typeof userMessage.content !== 'string') {
    userMessage.content.push({
      type: 'image_url',
      image_url: {
        url: input.data.attachments,
      },
    });
  }

  // Add a message to the thread
  const createdMessage = await openai.beta.threads.messages.create(
    threadId,
    userMessage
  );

  await saveMessages({
    messages: [
      {
        role: 'user',
        content: input.message,
        id: generateUUID(),
        createdAt: new Date(),
        chatId: threadId,
      },
    ],
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
          const lastMessage = messages.data
            .filter((role) => role.role === 'assistant')
            .pop();

          const responseMessagesWithoutIncompleteToolCalls =
            sanitizeResponseMessages([lastMessage] as any);

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
