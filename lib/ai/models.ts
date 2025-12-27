// Curated list of top models from Vercel AI Gateway
export const DEFAULT_CHAT_MODEL = "deepseek/deepseek-chat";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  // DeepSeek (排在第一位，默认选中)
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    provider: "deepseek",
    description: "Strong and affordable model",
  },
  {
    id: "deepseek/deepseek-reasoner",
    name: "DeepSeek R1",
    provider: "deepseek",
    description: "Reasoning model for complex logic",
  },
  // OpenAI
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    description: "Fast and cost-effective for simple tasks",
  },
  // Google
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    description: "Ultra fast and affordable",
  },
];

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
