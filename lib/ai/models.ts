export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "npo-yen-model",
    name: "NPO Yen",
    description: "Primary AI agent for Network Performance Optimization",
  },
  {
    id: "cs-minh-model",
    name: "CS Minh",
    description: "AI agent for CS by Minh",
  },
  {
    id: "cs-ai-model",
    name: "CS AI",
    description: "AI agent for CS",
  },
];
