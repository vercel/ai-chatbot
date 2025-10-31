export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Cerebras GPT-OSS",
    description: "Fast and efficient open-source model powered by Cerebras",
  },
  {
    id: "chat-model-reasoning",
    name: "Cerebras GPT-OSS Reasoning",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems",
  },
];
