export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Snappy",
    description:
      "Advanced multimodal model with vision, text, and tool usage capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "Thoughtful",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems with reasoning visibility",
  },
];
