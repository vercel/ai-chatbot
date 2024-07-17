export type CustomChatPrompt = Array<CustomChatMessage>;

export type CustomChatMessage =
  | CustomSystemMessage
  | CustomUserMessage
  | CustomAssistantMessage
  | CustomToolMessage;

export interface CustomSystemMessage {
  role: 'system';
  content: string;
}

export interface CustomUserMessage {
  role: 'user';
  content: string;
}

export interface CustomAssistantMessage {
  role: 'assistant';
  content: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

export interface CustomToolMessage {
  role: 'tool';
  name: string;
  content: string;
}