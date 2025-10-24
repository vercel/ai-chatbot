export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Mistral Large",
    description:
      "Advanced large language model with superior reasoning capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "Mistral Large (Reasoning)",
    description:
      "Mistral Large with enhanced chain-of-thought reasoning for complex problems",
  },
];
