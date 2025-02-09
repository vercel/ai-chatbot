import {
  CoreMessage,
  CoreToolMessage,
  generateId,
  Message as AIMessage,
  ToolInvocation,
} from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { Chat } from "@/db/schema";

// Extend the Message type to support complex content
interface Message extends Omit<AIMessage, 'content'> {
  content: string | Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
}

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
      "An error occurred while fetching the data.",
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }
  return [];
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId,
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: "result",
              result: toolResult.result,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

export function convertToUIMessages(
  messages: Array<CoreMessage>,
): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    if (message.role === "tool") {
      return addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages,
      });
    }

    let content: Message['content'] = "";
    let toolInvocations: Array<ToolInvocation> = [];

    if (typeof message.content === "string") {
      content = message.content;
    } else if (Array.isArray(message.content)) {
      // If the content is an array, preserve its structure
      content = message.content.map(item => {
        if (item.type === "text") {
          return {
            type: "text",
            text: item.text
          };
        } else if (item.type === "file") {
          return {
            type: "file",
            data: item.data,
            mimeType: item.mimeType
          };
        } else if (item.type === "tool-call") {
          toolInvocations.push({
            state: "call",
            toolCallId: item.toolCallId,
            toolName: item.toolName,
            args: item.args,
          });
          return null;
        }
        return item;
      }).filter(Boolean) as Message['content'];

      // If there's only text content, simplify to string
      if (Array.isArray(content) && content.length === 1 && content[0].type === "text") {
        content = content[0].text || "";
      }
    }

    chatMessages.push({
      id: generateId(),
      role: message.role,
      content,
      toolInvocations,
    });

    return chatMessages;
  }, []);
}

export function getTitleFromChat(chat: Chat) {
  const messages = convertToUIMessages(chat.messages as Array<CoreMessage>);
  const firstMessage = messages[0];

  if (!firstMessage) {
    return "Untitled";
  }

  // Handle complex content structure
  if (Array.isArray(firstMessage.content)) {
    const textContent = firstMessage.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');
    return textContent || "Untitled";
  }

  return firstMessage.content || "Untitled";
}
