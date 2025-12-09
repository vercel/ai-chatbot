export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Gemini 2.0 Flash",
    description: "Fast and capable multimodal model with vision capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "Gemini 2.0 Flash Thinking",
    description:
      "Experimental thinking model with extended reasoning capabilities",
  },
];
