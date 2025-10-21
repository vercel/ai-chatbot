// Cấu hình cho từng AI model
export interface ModelConfig {
  serverIP: string;
  port: string;
  assetId: string;
  username: string;
  password: string;
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  "npo-yen-model": {
    serverIP: process.env.INTERNAL_AI_SERVER_IP || "10.196.5.134",
    port: process.env.INTERNAL_AI_PORT || "28001",
    assetId: process.env.INTERNAL_AI_ASSET_ID || "70",
    username: process.env.INTERNAL_AI_USERNAME || "aiteam1",
    password: process.env.INTERNAL_AI_PASSWORD || "AInow123@",
  },
  "cs-ai-model": {
    serverIP: process.env.INTERNAL_AI_REASONING_SERVER_IP || "10.196.5.134",
    port: process.env.INTERNAL_AI_REASONING_PORT || "28001",
    assetId: process.env.INTERNAL_AI_REASONING_ASSET_ID || "56",
    username: process.env.INTERNAL_AI_REASONING_USERNAME || "aiteam1",
    password: process.env.INTERNAL_AI_REASONING_PASSWORD || "AInow123@",
  },
  "cs-minh-model": {
    serverIP: process.env.INTERNAL_AI_SERVER_IP || "10.196.5.134",
    port: process.env.INTERNAL_AI_PORT || "28001",
    assetId: process.env.INTERNAL_AI_ASSET_ID || "68",
    username: process.env.INTERNAL_AI_USERNAME || "aiteam1",
    password: process.env.INTERNAL_AI_PASSWORD || "AInow123@",
  },
};

// Helper function để lấy config cho model
export function getModelConfig(modelId: string): ModelConfig {
  const config = MODEL_CONFIGS[modelId];
  if (!config) {
    throw new Error(`No configuration found for model: ${modelId}`);
  }
  return config;
}
