// CLIENT-SAFE VERSION OF MODELS
// This file must NOT import any server-only dependencies

export const DEFAULT_CHAT_MODEL: string = 'openai-gpt4o';

// Define provider slugs as constants to maintain consistency
export const PROVIDERS = {
  OPENAI: 'openai',
  XAI: 'xai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  MISTRAL: 'mistral',
  GROQ: 'groq',
  COHERE: 'cohere',
} as const;

export type Provider = (typeof PROVIDERS)[keyof typeof PROVIDERS];

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: Provider | string;
  modelId: string;
}

/**
 * Utility function to normalize model IDs across the application
 * This helps prevent issues when model IDs are inconsistent between UI and backend
 */
export function normalizeModelId(
  modelId: string,
  preserveExactId = false,
): string {
  if (!modelId) return modelId;

  // Extract provider and model parts
  const parts = modelId.split('-');
  const provider = parts[0];

  // If we need to preserve the exact model ID format (for API calls)
  if (preserveExactId || parts.length < 2) {
    // Remove any date suffix (like -2024-09-12) before preserving
    return modelId.replace(/-\d{4}-\d{2}-\d{2}$/, '');
  }

  // For API calls where exact format is important, don't modify these models
  // These are models that have exact formats required by the providers
  const exactModelPatterns = [
    // OpenAI patterns
    /^openai-gpt-4o(-mini)?$/i,
    /^openai-gpt-4(\.\d+)?$/i,
    /^openai-gpt-3\.5-turbo$/i,
    /^openai-o1(-mini|-preview)?$/i,
    // xAI patterns
    /^xai-grok-\d+-\d+$/i,
    /^xai-grok-\d+-vision-\d+$/i,
    /^xai-grok-\d+-\w+-\w+$/i,
    // Anthropic patterns
    /^anthropic-claude-\d+(\.\d+)?(-\w+)?(-\d{8})?$/i,
    // Google patterns
    /^google-gemini-\d+(\.\d+)?(-\w+)?$/i,
    // Mistral patterns
    /^mistral-(small|medium|large)(-latest)?$/i,
    /^mistral-\w+-\d+b$/i,
    // General pattern for any model with version-date suffix
    /.*-\d{8}$/i,
  ];

  // Check if this is an exact model ID we should preserve
  if (exactModelPatterns.some((pattern) => pattern.test(modelId))) {
    return modelId;
  }

  // Get the actual model part
  let model = parts.slice(1).join('-').toLowerCase();

  // Map of model ID aliases to their normalized versions
  const modelAliases: Record<string, string> = {
    // OpenAI aliases
    'gpt4o-mini': 'o3mini',
    'gpt-4o-mini': 'o3mini',
    '4o-mini': 'o3mini',
    'gpt-4o': 'gpt4o',
    '4o': 'gpt4o',
    'gpt-4': 'gpt4',
    '4': 'gpt4',
    'gpt-3.5-turbo': 'gpt35turbo',
    '3.5-turbo': 'gpt35turbo',
    'dall-e-3': 'dalle3',
    'dall-e-2': 'dalle2',
    o1: 'o1',
    'o1-mini': 'o1mini',
    // Anthropic aliases
    'claude-3.7-sonnet': 'claude37sonnet',
    'claude-3.5-sonnet': 'claude35sonnet',
    'claude-3-opus': 'claude3opus',
    'claude-3-sonnet': 'claude3sonnet',
    'claude-3-haiku': 'claude3haiku',
    // Google aliases
    'gemini-1.5-pro': 'gemini15pro',
    'gemini-1.5-flash': 'gemini15flash',
    'gemini-1.0-pro': 'gemini10pro',
    'gemini-1.0-ultra': 'gemini10ultra',
    // Mistral aliases
    'mistral-large': 'mistrallarge',
    'mistral-medium': 'mistralmedium',
    'mistral-small': 'mistralsmall',
    // Groq aliases
    'llama3-70b': 'llama370b',
    'llama3-8b': 'llama38b',
  };

  // Check if we have a direct mapping for this model
  if (modelAliases[model]) {
    return `${provider}-${modelAliases[model]}`;
  }

  // Normalize the model ID
  if (model.startsWith('gpt-')) {
    model = model.replace('gpt-', 'gpt');
  } else if (model.includes('-mini')) {
    model = model.replace('-mini', 'mini');
  } else if (model.includes('-')) {
    // For any other model with hyphens, convert to consistent format
    model = model.replace(/-/g, '');
  }

  return `${provider}-${model}`;
}

// Static model list for client components
export const chatModels: Array<ChatModel> = [
  // OpenAI models
  {
    id: 'openai-gpt4o',
    name: 'GPT-4o (OpenAI)',
    description: 'Advanced vision-capable model',
    provider: PROVIDERS.OPENAI,
    modelId: 'gpt-4o',
  },
  {
    id: 'openai-o3mini',
    name: 'GPT-4o Mini (OpenAI)',
    description: 'Fast STEM reasoning model',
    provider: PROVIDERS.OPENAI,
    modelId: 'gpt-4o-mini',
  },
  {
    id: 'openai-gpt4',
    name: 'GPT-4 (OpenAI)',
    description: 'Advanced reasoning model',
    provider: PROVIDERS.OPENAI,
    modelId: 'gpt-4',
  },
  {
    id: 'openai-gpt35turbo',
    name: 'GPT-3.5 Turbo (OpenAI)',
    description: 'Fast general purpose model',
    provider: PROVIDERS.OPENAI,
    modelId: 'gpt-3.5-turbo',
  },
  {
    id: 'openai-reasoning',
    name: 'Reasoning (OpenAI)',
    description: 'Advanced reasoning capabilities',
    provider: PROVIDERS.OPENAI,
    modelId: 'gpt-4o',
  },

  // xAI models
  {
    id: 'xai-grok2',
    name: 'Grok-2 (xAI)',
    description: 'General purpose chat model',
    provider: PROVIDERS.XAI,
    modelId: 'grok-2-1212',
  },
  {
    id: 'xai-grok2-vision',
    name: 'Grok-2 Vision (xAI)',
    description: 'Vision-capable model',
    provider: PROVIDERS.XAI,
    modelId: 'grok-2-vision-1212',
  },
  {
    id: 'xai-grok3-mini',
    name: 'Grok-3 Mini (xAI)',
    description: 'Compact reasoning model',
    provider: PROVIDERS.XAI,
    modelId: 'grok-3-mini-beta',
  },

  // Anthropic Claude models
  {
    id: 'anthropic-claude37sonnet',
    name: 'Claude 3.7 Sonnet (Anthropic)',
    description: 'Advanced reasoning and language understanding',
    provider: PROVIDERS.ANTHROPIC,
    modelId: 'claude-3.7-sonnet-20250224',
  },
  {
    id: 'anthropic-claude35sonnet',
    name: 'Claude 3.5 Sonnet (Anthropic)',
    description: 'Fast, powerful reasoning model',
    provider: PROVIDERS.ANTHROPIC,
    modelId: 'claude-3.5-sonnet-20241022',
  },
  {
    id: 'anthropic-claude3opus',
    name: 'Claude 3 Opus (Anthropic)',
    description: 'Most capable Claude model',
    provider: PROVIDERS.ANTHROPIC,
    modelId: 'claude-3-opus-20240229',
  },
  {
    id: 'anthropic-claude3sonnet',
    name: 'Claude 3 Sonnet (Anthropic)',
    description: 'Balanced performance and speed',
    provider: PROVIDERS.ANTHROPIC,
    modelId: 'claude-3-sonnet-20240229',
  },
  {
    id: 'anthropic-claude3haiku',
    name: 'Claude 3 Haiku (Anthropic)',
    description: 'Fast, cost-effective performance',
    provider: PROVIDERS.ANTHROPIC,
    modelId: 'claude-3-haiku-20240307',
  },

  // Google models
  {
    id: 'google-gemini15pro',
    name: 'Gemini 1.5 Pro (Google)',
    description: 'Advanced multimodal reasoning',
    provider: PROVIDERS.GOOGLE,
    modelId: 'gemini-1.5-pro',
  },
  {
    id: 'google-gemini15flash',
    name: 'Gemini 1.5 Flash (Google)',
    description: 'Fast inference for real-time applications',
    provider: PROVIDERS.GOOGLE,
    modelId: 'gemini-1.5-flash',
  },

  // Mistral models
  {
    id: 'mistral-mistrallarge',
    name: 'Mistral Large (Mistral)',
    description: 'Advanced reasoning capabilities',
    provider: PROVIDERS.MISTRAL,
    modelId: 'mistral-large-latest',
  },
  {
    id: 'mistral-mistralmedium',
    name: 'Mistral Medium (Mistral)',
    description: 'Balanced performance',
    provider: PROVIDERS.MISTRAL,
    modelId: 'mistral-medium-latest',
  },
];

// Helper function to get the model's provider
export function getModelProvider(modelId: string): string {
  const model = chatModels.find((m) => m.id === modelId);
  return model?.provider || PROVIDERS.OPENAI;
}

// Define image models for each provider
export interface ImageModel {
  id: string;
  provider: Provider | string;
  modelId: string;
  size?: string;
  quality?: 'standard' | 'hd';
}

export const imageModels: Record<string, ImageModel> = {
  [PROVIDERS.OPENAI]: {
    id: 'openai-dalle3',
    provider: PROVIDERS.OPENAI,
    modelId: 'dall-e-3',
    size: '1024x1024',
    quality: 'standard',
  },
  [PROVIDERS.XAI]: {
    id: 'xai-grok2-image',
    provider: PROVIDERS.XAI,
    modelId: 'grok-2-image',
  },
  [PROVIDERS.GOOGLE]: {
    id: 'google-imagen3',
    provider: PROVIDERS.GOOGLE,
    modelId: 'imagen-3',
  },
};

// Default provider configuration as fallback
export function getDefaultProviderConfig() {
  return {
    [PROVIDERS.OPENAI]: {
      fromEnv: false,
      apiKey: null,
      baseUrl: null,
    },
    [PROVIDERS.XAI]: {
      fromEnv: false,
      apiKey: null,
      baseUrl: null,
    },
    [PROVIDERS.ANTHROPIC]: {
      fromEnv: false,
      apiKey: null,
      baseUrl: null,
    },
    [PROVIDERS.GOOGLE]: {
      fromEnv: false,
      apiKey: null,
      baseUrl: null,
    },
    [PROVIDERS.MISTRAL]: {
      fromEnv: false,
      apiKey: null,
      baseUrl: null,
    },
    [PROVIDERS.GROQ]: {
      fromEnv: false,
      apiKey: null,
      baseUrl: null,
    },
    [PROVIDERS.COHERE]: {
      fromEnv: false,
      apiKey: null,
      baseUrl: null,
    },
  };
}
