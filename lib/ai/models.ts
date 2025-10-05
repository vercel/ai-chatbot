export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Claude Sonnet 4.5",
    description: "Anthropic Sonnet 4.5 for general chat and tools",
  },
  {
    id: "chat-model-reasoning",
    name: "Claude Sonnet 4.5 (Reasoning)",
    description: "Sonnet 4.5 with 16k thinking budget enabled for complex reasoning",
  },
];
