export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  capabilities?: {
    webSearch?: boolean;
  };
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Grok Vision",
    description: "Advanced multimodal model with vision and text capabilities",
    capabilities: {
      webSearch: true,
    },
  },
  {
    id: "chat-model-reasoning",
    name: "Grok Reasoning",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems",
    capabilities: {
      webSearch: true,
    },
  },
];

export function getModelCapabilities(modelId: string) {
  const model = chatModels.find((m) => m.id === modelId);
  return model?.capabilities || {};
}

export function supportsWebSearch(modelId: string): boolean {
  return getModelCapabilities(modelId).webSearch === true;
}
