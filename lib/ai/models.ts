export const DEFAULT_CHAT_MODEL: string = "npo-yen-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "npo-yen-model",
    name: "NPO Yen",
    description: "NPO Yen AI Model - Specialized for Network Performance Optimization tasks",
  },
  {
    id: "cs-minh-model",
    name: "CS Minh",
    description: "CS Minh AI Model - Customer Service AI model developed by Minh",
  },
  {
    id: "cs-ai-model",
    name: "CS AI",
    description: "CS AI Model - General Customer Service AI model",
  },
];
