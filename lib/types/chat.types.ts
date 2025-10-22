/**
 * Chat-related types
 */

export type MessageRole = "user" | "assistant" | "system";

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt?: string;
  metadata?: MessageMetadata;
};

export type MessageMetadata = {
  createdAt: string;
  [key: string]: any;
};

export type ChatStatus = "idle" | "loading" | "streaming" | "error";

export type ChatState = {
  messages: Message[];
  status: ChatStatus;
  isTyping: boolean;
  error?: string;
};

export type SendMessageOptions = {
  role?: MessageRole;
  mockResponse?: string;
  onSuccess?: (message: Message) => void;
  onError?: (error: Error) => void;
};
