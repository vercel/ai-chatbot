export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "GPT-5 Mini",
    description:
      "Advanced multimodal model with vision, text, and tool usage capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "GPT-5 Mini Reasoning",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems with reasoning visibility",
  },
];
