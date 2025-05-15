import {
  convertToCoreMessages,
  type DataStreamWriter,
  formatDataStreamPart,
  type CoreAssistantMessage,
  type CoreToolMessage,
  type Message,
  type UIMessage,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Document } from '@/lib/db/schema';
import type { ExecutableToolSet } from './ai/tools';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function sanitizeResponseMessages({
  messages,
  reasoning,
}: {
  messages: Array<ResponseMessage>;
  reasoning: string | undefined;
}) {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    if (reasoning) {
      // @ts-expect-error: reasoning message parts in sdk is wip
      sanitizedContent.push({ type: 'reasoning', reasoning });
    }

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

export function getTrailingAssistantMessage({
  messages,
}: { messages: Array<Message> }): Message | null {
  const assistantMessages = messages.filter(
    (message) => message.role === 'assistant',
  );
  return assistantMessages.at(-1) || null;
}

export function formatJSON(jsonString: string) {
  try {
    return JSON.stringify(jsonString, null, 2);
  } catch (e) {
    return jsonString;
  }
}

export function formatToolContent(result?: any) {
  if (result && typeof result === 'object') {
    if (result.content) {
      if (typeof result.content === 'object') {
        if (Array.isArray(result.content)) {
          return result.content
            .map((item: any) => {
              if (item.type && item.type === 'text') {
                return item.text;
              } else {
                return JSON.stringify(item, null, 2);
              }
            })
            .join('\n');
        } else {
          return JSON.stringify(result.content, null, 2);
        }
      } else if (typeof result.content === 'string') {
        return result.content;
      } else {
        return 'Unknwown content type';
      }
    } else {
      return JSON.stringify(result, null, 2);
    }
  }

  return '';
}

export const APPROVAL = {
  YES: 'Yes, confirmed.',
  NO: 'No, denied.',
} as const;

export async function processToolCalls(
  {
    dataStream,
    messages,
  }: {
    dataStream: DataStreamWriter;
    messages: Message[];
  },
  executeFunctions: ExecutableToolSet,
): Promise<{ messages: Message[]; updated: boolean }> {
  const lastMessage = messages[messages.length - 1];
  const parts = lastMessage.parts;

  if (!parts) {
    return { messages, updated: false };
  }

  const processedParts = await Promise.all(
    parts.map(async (part) => {
      if (part.type !== 'tool-invocation') {
        return part;
      }

      const { toolInvocation } = part;
      const toolName = toolInvocation.toolName;

      if (
        !(toolName in executeFunctions) ||
        toolInvocation.state !== 'result'
      ) {
        return part;
      }

      let result: any;

      if (toolInvocation.result === APPROVAL.YES) {
        const toolInstance = executeFunctions[toolName];
        if (toolInstance) {
          result = await toolInstance(toolInvocation.args, {
            messages: convertToCoreMessages(messages),
            toolCallId: toolInvocation.toolCallId,
          });
        } else {
          result = 'Error: No execute function found on tool';
        }
      } else if (toolInvocation.result === APPROVAL.NO) {
        result = 'Error: User denied access to tool execution';
      } else {
        return part;
      }

      dataStream.write(
        formatDataStreamPart('tool_result', {
          toolCallId: toolInvocation.toolCallId,
          result,
        }),
      );

      return {
        ...part,
        toolInvocation: {
          ...toolInvocation,
          result,
        },
      };
    }),
  );

  return {
    messages: [
      ...messages.slice(0, -1),
      { ...lastMessage, parts: processedParts },
    ],
    updated:
      lastMessage?.parts?.some(
        (part, index) =>
          JSON.stringify(part) !== JSON.stringify(processedParts[index]),
      ) ?? false,
  };
}

export function hasUpdatedMessage(
  prevMessages: Array<Message>,
  messages: Array<Message>,
) {
  return (
    prevMessages.length !== messages.length ||
    prevMessages.some((message, index) => {
      const newMessage = messages[index];
      if (message.id !== newMessage.id || message.role !== newMessage.role) {
        return true;
      }

      if (!message.parts || !newMessage.parts) {
        return message.parts !== newMessage.parts;
      }

      if (message.parts.length !== newMessage.parts.length) {
        return true;
      }

      return message.parts.some(
        (part, partIndex) =>
          JSON.stringify(part) !==
          JSON.stringify(newMessage.parts?.[partIndex]),
      );
    })
  );
}

export function extractToolNameFromString(message: string): string[] {
  const regex = /@(\w+)/g;
  const matches = message.match(regex);
  if (!matches) {
    return [];
  }
  return matches.map((match) => match.replace('@', ''));
}

export function extractToolNameFromMessage(message: UIMessage): string[] {
  if (!message || !message.parts) {
    return [];
  }

  if (typeof message.parts === 'string') {
    return extractToolNameFromString(message.parts);
  }

  if (!Array.isArray(message.parts)) {
    return [];
  }

  return message.parts.reduce((acc, part) => {
    if (typeof part === 'string') {
      const toolNames = extractToolNameFromString(part);
      acc.push(...toolNames);
    } else if (typeof part === 'object' && part.type === 'text') {
      const toolNames = extractToolNameFromString(part.text);
      acc.push(...toolNames);
    }
    return acc;
  }, [] as string[]);
}
