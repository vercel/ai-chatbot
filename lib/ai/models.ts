export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type WebLLMQuality = "draft" | "standard" | "high" | "best";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  isLocal?: boolean;
  qualityHint?: WebLLMQuality;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Grok Vision",
    description: "Advanced multimodal model with vision and text capabilities",
  },
  {
    id: "chat-model-reasoning",
    name: "Grok Reasoning",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems",
  },
  {
    id: "webllm-draft",
    name: "WebLLM Draft",
    description: "Fast local inference - lighter model, quick responses",
    isLocal: true,
    qualityHint: "draft",
  },
  {
    id: "webllm-standard",
    name: "WebLLM Standard",
    description: "Balanced local inference - good quality and speed",
    isLocal: true,
    qualityHint: "standard",
  },
  {
    id: "webllm-high",
    name: "WebLLM High",
    description: "High quality local inference - better responses",
    isLocal: true,
    qualityHint: "high",
  },
  {
    id: "webllm-best",
    name: "WebLLM Best",
    description: "Best quality local inference - largest model, slower",
    isLocal: true,
    qualityHint: "best",
  },
];

export function isWebLLMModel(modelId: string): boolean {
  return modelId.startsWith("webllm");
}

export function getWebLLMQuality(modelId: string): WebLLMQuality {
  const model = chatModels.find((m) => m.id === modelId);
  return model?.qualityHint ?? "standard";
}
