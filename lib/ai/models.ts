export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "NPO AI Agent",
    description: "Internal AI agent specialized in Network Performance Optimization",
  },
  {
    id: "chat-model-reasoning",
    name: "NPO AI Reasoning",
    description:
      "Internal AI agent with advanced reasoning for complex telecom problems",
  },
];
