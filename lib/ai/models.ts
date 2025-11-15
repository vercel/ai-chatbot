export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "GPT-4o",
    description: "OpenAI's most advanced model with superior reasoning and multimodal capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "GPT-4o Mini",
    description:
      "Faster and more efficient GPT-4o model with advanced reasoning capabilities",
  },
];
