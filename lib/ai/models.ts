export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  isLocal?: boolean;
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
    id: "webllm",
    name: "WebLLM (Local)",
    description:
      "Runs entirely in your browser - no API key required. Requires WebGPU.",
    isLocal: true,
  },
];

export function isWebLLMModel(modelId: string): boolean {
  return modelId === "webllm";
}
