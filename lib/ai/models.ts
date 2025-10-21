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
    description: "Primary AI agent for Network Performance Optimization (Server: 10.196.5.134:28001)",
  },
  {
    id: "chat-model-reasoning",
    name: "NPO AI Reasoning",
    description: "Advanced reasoning AI agent for complex telecom problems (Server: 10.196.5.135:28002)",
  },
];
