export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "gpt-4o",
    description: "Multimodal model with vision and text capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "o3-mini",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems",
  },
];
