import type {
  CoreAssistantMessage,
  CoreToolMessage,
  UIMessage,
  UIMessagePart,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { formatISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import type { Document, MessagePart, Message } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';
import type { ChatMessage, ChatTools, CustomUIDataTypes } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

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

/**
 * Generates a JSON-safe random number that won't lose precision during serialization.
 * Returns a random integer between 0 and 2^53 - 1 (JavaScript's MAX_SAFE_INTEGER).
 * This ensures the number remains a number (not string) when serialized to JSON.
 */
export function generateJSONSafeRandomNumber(): string {
  // JavaScript's MAX_SAFE_INTEGER is 2^53 - 1 = 9007199254740991
  const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
  
  // Generate a random number between 0 and MAX_SAFE_INTEGER
  return Math.floor(Math.random() * (MAX_SAFE_INTEGER + 1)).toString();
}

/**
 * Gets the current Unix timestamp in seconds as a BigInt
 */
export const getUnixTimestamp = (): bigint => BigInt(Math.floor(Date.now() / 1000));

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: UIMessage[]) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Document[],
  index: number,
) {
  if (!documents) { return new Date(); }
  if (index > documents.length) { return new Date(); }

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: ResponseMessage[];
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) { return null; }

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

/**
 * Maps a ZodMessage part to a UIMessagePart for UI display
 */
function mapZodMessagePartToUIMessagePart(
  messagePart: { type: string; content?: string; mimeType?: string; data?: Uint8Array }
): UIMessagePart<CustomUIDataTypes, ChatTools> {
  // Handle text parts
  if (messagePart.type === 'text') {
    return {
      type: 'text',
      text: messagePart.content || '',
    };
  }

  // Handle reasoning parts
  if (messagePart.type === 'reasoning') {
    return {
      type: 'reasoning',
      text: messagePart.content || '',
    };
  }

  // Handle file parts
  if (messagePart.type === 'file') {
    return {
      type: 'file',
      url: messagePart.content || '',
      mediaType: messagePart.mimeType as 'image/jpeg' | 'image/png',
    };
  }

  // Handle source URL parts
  if (messagePart.type === 'source-url') {
    const data = JSON.parse(messagePart.content || '{}');
    return {
      type: 'source-url',
      sourceId: data.sourceId,
      url: data.url,
      title: data.title,
    };
  }

  // Handle source document parts
  if (messagePart.type === 'source-document') {
    const data = JSON.parse(messagePart.content || '{}');
    return {
      type: 'source-document',
      sourceId: data.sourceId,
      mediaType: data.mediaType,
      title: data.title,
      filename: data.filename,
    };
  }

  // Handle tool parts
  if (messagePart.type.startsWith('tool-')) {
    const data = JSON.parse(messagePart.content || '{}');
    return {
      type: `tool-${data.toolName}` as any,
      toolName: data.toolName,
      toolCallId: data.toolCallId,
      state: data.state,
      input: data.input,
      output: data.output,
      errorText: data.errorText,
    };
  }

  // Handle dynamic tool parts
  if (messagePart.type === 'dynamic-tool') {
    const data = JSON.parse(messagePart.content || '{}');
    return {
      type: 'dynamic-tool',
      toolName: data.toolName,
      toolCallId: data.toolCallId,
      state: data.state,
      input: data.input,
      output: data.output,
      errorText: data.errorText,
    };
  }

  // Handle data parts
  if (messagePart.type.startsWith('data')) {
    const data = JSON.parse(messagePart.content || '{}');
    return {
      type: `data-${data.dataType}` as any,
      id: data.id,
      data: data.data,
    };
  }

  // Handle step start parts
  if (messagePart.type === 'step-start') {
    return {
      type: 'step-start',
    };
  }
  

  throw new Error(`Unknown message part type: ${messagePart.type}`);
}

export function convertZodMessagesToUI(messages: Message[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: message.parts.map(mapZodMessagePartToUIMessagePart),
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}

export function getTextFromMessage(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

/**
 * Maps a UIMessagePart to Zod format for API requests
 */
export function mapUIMessagePartToZodFormat(
  uiPart: UIMessagePart<CustomUIDataTypes, ChatTools>
): MessagePart {
  // Handle text parts
  if (uiPart.type === 'text') {
    return {
      type: 'text',
      content: uiPart.text,
      mimeType: 'text/plain',
      data: new Uint8Array(),
    };
  }

  // Handle reasoning parts
  if (uiPart.type === 'reasoning') {
    return {
      type: 'reasoning',
      content: uiPart.text,
      mimeType: 'text/plain',
      data: new Uint8Array(),
    };
  }

  // Handle file parts
  if (uiPart.type === 'file') {
    return {
      type: 'file',
      content: uiPart.url || '',
      mimeType: uiPart.mediaType,
      data: new Uint8Array(),
    };
  }

  // Handle source URL parts
  if (uiPart.type === 'source-url') {
    return {
      type: 'source-url',
      content: JSON.stringify({
        sourceId: uiPart.sourceId,
        url: uiPart.url,
        title: uiPart.title,
      }),
      mimeType: 'application/json',
      data: new Uint8Array(),
    };
  }

  // Handle source document parts
  if (uiPart.type === 'source-document') {
    return {
      type: 'source-document',
      content: JSON.stringify({
        sourceId: uiPart.sourceId,
        mediaType: uiPart.mediaType,
        title: uiPart.title,
        filename: uiPart.filename,
      }),
      mimeType: 'application/json',
      data: new Uint8Array(),
    };
  }

  // Handle tool parts
  if (uiPart.type.startsWith('tool-')) {
    const toolName = uiPart.type.replace('tool-', '');
    const toolPart = uiPart as any; // Type assertion for tool parts
    return {
      type: uiPart.type,
      content: JSON.stringify({
        toolName,
        toolCallId: toolPart.toolCallId,
        state: toolPart.state,
        input: toolPart.input,
        output: toolPart.output,
        errorText: toolPart.errorText,
      }),
      mimeType: 'application/json',
      data: new Uint8Array(),
    };
  }

  // Handle dynamic tool parts
  if (uiPart.type === 'dynamic-tool') {
    const dynamicToolPart = uiPart as any; // Type assertion for dynamic tool parts
    return {
      type: 'dynamic-tool',
      content: JSON.stringify({
        toolName: dynamicToolPart.toolName,
        toolCallId: dynamicToolPart.toolCallId,
        state: dynamicToolPart.state,
        input: dynamicToolPart.input,
        output: dynamicToolPart.output,
        errorText: dynamicToolPart.errorText,
      }),
      mimeType: 'application/json',
      data: new Uint8Array(),
    };
  }

  // Handle data parts
  if (uiPart.type.startsWith('data-')) {
    const dataType = uiPart.type.replace('data-', '');
    const dataPart = uiPart as any; // Type assertion for data parts
    return {
      type: 'data',
      content: JSON.stringify({
        dataType,
        id: dataPart.id,
        data: dataPart.data,
      }),
      mimeType: 'application/json',
      data: new Uint8Array(),
    };
  }

  // Handle step start parts
  if (uiPart.type === 'step-start') {
    return {
      type: 'step-start',
      content: '',
      mimeType: 'text/plain',
      data: new Uint8Array(),
    };
  }

  throw new Error(`Unknown message part type: ${uiPart.type}`);
}
