import type { ModelConfig } from '../types'; // Adjusted path

// Export the default model ID for backward compatibility
export const DEFAULT_CHAT_MODEL: string = 'grok-chat';

export const models: ModelConfig[] = [
  // --- Existing Grok Models (Refactored) ---
  {
    id: 'grok-chat', // Preserving a simple internal ID
    providerModelId: 'grok-2-vision-1212', // Actual provider model ID from providers.ts
    name: 'Grok Chat', // User-friendly name
    description: 'Primary model for all-purpose chat (Grok)', // Updated description
    provider: 'xai',
    logoPath: '/logos/grok-logo.svg', // Placeholder - needs actual logo
    maxTokens: 4096, // Assigning a reasonable default
    temperature: 0.7, // Assigning a reasonable default
    capabilities: ['chat', 'vision'], // Inferred from provider model ID
    isDefault: true, // Assuming this was the default
  },
  {
    id: 'grok-reasoning', // Preserving a simple internal ID
    providerModelId: 'grok-3-mini-beta', // Actual provider model ID from providers.ts
    name: 'Grok Reasoning', // User-friendly name
    description: 'Uses advanced reasoning (Grok)', // Updated description
    provider: 'xai',
    logoPath: '/logos/grok-logo.svg', // Placeholder - needs actual logo
    maxTokens: 8192, // Assigning a reasonable default for reasoning
    temperature: 0.2, // Assigning a reasonable default for reasoning
    capabilities: ['chat', 'reasoning'], // Inferred from name/description
    isDefault: false,
  },
  // --- New Gemini Models ---
  {
    id: 'gemini-pro', // Unique internal ID
    providerModelId: 'gemini-2.5-pro-preview-05-06', // Actual Google model ID
    name: 'Gemini Pro',
    description: 'Advanced reasoning model for complex problems',
    provider: 'google',
    logoPath: '/logos/gemini-pro.svg', // Assumes this will exist
    maxTokens: 8192,
    temperature: 0.2,
    capabilities: ['chat', 'reasoning', 'knowledge', 'coding'],
    isDefault: false,
  },
  {
    id: 'gemini-vision', // Unique internal ID
    providerModelId: 'gemini-2.5-pro-preview-05-06', // Same Google model ID, different config/use case
    name: 'Gemini Vision',
    description: 'Multimodal AI with vision capabilities',
    provider: 'google',
    logoPath: '/logos/gemini-vision.svg', // Assumes this will exist
    maxTokens: 8192,
    temperature: 0.7,
    capabilities: ['chat', 'vision', 'reasoning'],
    isDefault: false,
  },
  {
    id: 'gemini-flash', // Unique internal ID
    providerModelId: 'gemini-2.5-flash-preview-05-06', // Actual Google model ID
    name: 'Gemini Flash',
    description: 'Ultra-fast responses with high efficiency',
    provider: 'google',
    logoPath: '/logos/gemini-flash.svg', // Assumes this will exist
    maxTokens: 4096,
    temperature: 0.7,
    capabilities: ['chat'],
    isDefault: false,
  },
  // --- Other Grok Models (from providers.ts) ---
  {
    id: 'title-model', // Internal ID based on old key
    providerModelId: 'grok-2-1212', // From providers.ts
    name: 'Grok Title Generator', // Guessing name
    description: 'Generates titles based on content (Grok)', // Guessing description
    provider: 'xai',
    logoPath: '/logos/grok-logo.svg', // Placeholder
    maxTokens: 1024, // Guessing
    temperature: 0.5, // Guessing
    capabilities: ['text-generation'], // Guessing capability
    isDefault: false,
  },
  {
    id: 'artifact-model', // Internal ID based on old key
    providerModelId: 'grok-2-1212', // From providers.ts
    name: 'Grok Artifact Generator', // Guessing name
    description: 'Generates artifacts based on context (Grok)', // Guessing description
    provider: 'xai',
    logoPath: '/logos/grok-logo.svg', // Placeholder
    maxTokens: 2048, // Guessing (maybe more than title)
    temperature: 0.6, // Guessing
    capabilities: ['text-generation', 'artifact-creation'], // Guessing capabilities
    isDefault: false,
  },
];

// Export models array as chatModels for backward compatibility
export const chatModels = models;

// Optional: Helper function to get model config by ID
export function getModelConfigById(id: string): ModelConfig | undefined {
  return models.find(model => model.id === id);
}