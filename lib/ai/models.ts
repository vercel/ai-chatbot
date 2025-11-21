export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  icon: string;
  useCases: string;
  speed: "fast" | "thorough";
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Everyday tasks",
    description: "Fast, efficient responses",
    icon: "⚡",
    useCases: "Quick answers, code writing, general questions",
    speed: "fast",
  },
  {
    id: "chat-model-reasoning",
    name: "Complex problems",
    description: "Thorough reasoning, takes longer",
    icon: "🧠",
    useCases: "Multi-step planning, deep analysis, tough debugging",
    speed: "thorough",
  },
];
