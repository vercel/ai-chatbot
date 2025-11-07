export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "OpenAI GPT-4o Mini",
    description: "Fast multimodal model for chat, tools, and vision",
  },
  {
    id: "chat-model-reasoning",
    name: "OpenAI o4-mini (Reasoning)",
    description: "Reasoning-optimized model for complex multi-step problems",
  },
];
