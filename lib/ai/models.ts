export const HYPO_PROVIDER = "@HypO";

export const DEFAULT_CHAT_MODEL = `${HYPO_PROVIDER}/HyperLite`;

export const titleModel = {
  description: "Fast model for title generation",
  id: `${HYPO_PROVIDER}/HyperLite`,
  name: "HyperLite",
  provider: HYPO_PROVIDER,
};

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    description: "Largest HypO model",
    id: `${HYPO_PROVIDER}/HyperMax`,
    name: "HyperMax",
    provider: HYPO_PROVIDER,
  },
  {
    description: "Balanced HypO model",
    id: `${HYPO_PROVIDER}/HyperMix`,
    name: "HyperMix",
    provider: HYPO_PROVIDER,
  },
  {
    description: "Fastest HypO model",
    id: `${HYPO_PROVIDER}/HyperLite`,
    name: "HyperLite",
    provider: HYPO_PROVIDER,
  },
];

// @HypO is a single OpenAI-compatible endpoint; capabilities are uniform.
const HYPO_CAPABILITIES: ModelCapabilities = {
  reasoning: false,
  tools: true,
  vision: false,
};

export function getCapabilities(): Record<string, ModelCapabilities> {
  return Object.fromEntries(
    chatModels.map((model) => [model.id, HYPO_CAPABILITIES])
  );
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));
