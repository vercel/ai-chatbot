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
    serverIP: "10.196.5.134",
    port: "28001",
    assetId: "70",
    username: "aiteam1",
    password: "AInow123@",
  },
  "cs-ai-model": {
    serverIP: "10.196.5.134",
    port: "28001",
    assetId: "56",
    username: "aiteam1",
    password: "AInow123@",
  },
  "cs-minh-model": {
    serverIP: "10.196.5.134",
    port: "28001",
    assetId: "68",
    username: "aiteam1",
    password: "AInow123@",
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
