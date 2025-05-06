import {
  formatDataStreamPart,
  type CoreAssistantMessage,
  type CoreToolMessage,
  type ToolCall,
  type ToolResult,
  type UIMessage,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Document } from '@/lib/db/schema';

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

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

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

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

/**
 * Converts an array of UIMessage parts into an array of DataStreamString.
 */
export function partsToDataStreamStrings(parts: UIMessage['parts']): any[] {
  const streams: any[] = [];

  for (const part of parts) {
    switch (part.type) {
      case 'text': {
        const textPart = part;
        streams.push(formatDataStreamPart('text', textPart.text));
        break;
      }

      case 'reasoning': {
        const reasoningPart = part;
        streams.push(
          formatDataStreamPart('reasoning', reasoningPart.reasoning),
        );
        break;
      }

      case 'tool-invocation': {
        const invocationPart = part;
        const invocation = invocationPart.toolInvocation;

        // Tool call in progress (partial or full)
        if (
          invocation.state === 'partial-call' ||
          invocation.state === 'call'
        ) {
          const call = invocation as ToolCall<string, any> & { state: string };
          streams.push(
            formatDataStreamPart('tool_call', {
              toolCallId: call.toolCallId,
              toolName: call.toolName,
              args: call.args,
            }),
          );
        }

        // Tool result
        if (invocation.state === 'result') {
          const result = invocation as ToolResult<string, any, any> & {
            state: 'result';
          };
          streams.push(
            formatDataStreamPart('tool_result', {
              toolCallId: result.toolCallId,
              result: result.result,
            }),
          );
        }
        break;
      }

      case 'source': {
        const sourcePart = part;
        streams.push(formatDataStreamPart('source', sourcePart.source));
        break;
      }

      case 'file': {
        const filePart = part;
        streams.push(
          formatDataStreamPart('file', {
            data: filePart.data,
            mimeType: filePart.mimeType,
          }),
        );
        break;
      }

      case 'step-start': {
        const stepPart = part;
        // Note: StepStartUIPart has no messageId, adjust as needed
        // Here we emit a start_step with an empty messageId
        streams.push(
          formatDataStreamPart('start_step', {
            messageId: '',
          }),
        );
        break;
      }

      default:
        // Unsupported part type, skip or throw
        console.warn(`Skipping unsupported part type: ${(part as any).type}`);
    }
  }

  return streams;
}
