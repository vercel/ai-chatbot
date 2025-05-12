export type DataPart = { type: 'append-message'; message: string };

export interface ModelConfig {
  id: string; // Unique identifier for the model within the application (e.g., 'grok-chat', 'gemini-flash')
  providerModelId: string; // The actual model ID used by the provider API (e.g., 'grok-2-vision-1212', 'gemini-2.5-flash-preview-05-06')
  name: string; // User-facing display name (e.g., 'Grok Chat', 'LostMind Flash')
  description: string; // User-facing description
  provider: 'google' | 'xai' | 'openai'; // The provider identifier
  logoPath?: string; // Optional path to the model's logo SVG
  maxTokens: number; // Default max output tokens
  temperature: number; // Default temperature
  capabilities: string[]; // List of capabilities (e.g., 'chat', 'vision', 'reasoning')
  isDefault?: boolean; // Optional flag for the default model
}
