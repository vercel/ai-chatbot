import { getAbsoluteUrl } from '@/lib/utils';

export const DEFAULT_CHAT_MODEL: string = 'openai-gpt4o';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  modelId: string;
}

// DEPRECATED: Static model list - will be removed in future versions
// Use getAvailableChatModels() function instead
export const chatModels: Array<ChatModel> = [
  // OpenAI models
  {
    id: 'openai-gpt4o',
    name: 'GPT-4o (OpenAI)',
    description: 'Advanced vision-capable model',
    provider: 'openai',
    modelId: 'gpt-4o',
  },
  {
    id: 'openai-o3mini',
    name: 'O3-mini (OpenAI)',
    description: 'Fast STEM reasoning model',
    provider: 'openai',
    modelId: 'o3-mini',
  },
  {
    id: 'openai-reasoning',
    name: 'Reasoning (OpenAI)',
    description: 'Advanced reasoning capabilities',
    provider: 'openai',
    modelId: 'gpt-4o',
  },

  // xAI models
  {
    id: 'xai-grok2',
    name: 'Grok-2 (xAI)',
    description: 'General purpose chat model',
    provider: 'xai',
    modelId: 'grok-2-1212',
  },
  {
    id: 'xai-grok2-vision',
    name: 'Grok-2 Vision (xAI)',
    description: 'Vision-capable model',
    provider: 'xai',
    modelId: 'grok-2-vision-1212',
  },
  {
    id: 'xai-grok3-mini',
    name: 'Grok-3 Mini (xAI)',
    description: 'Compact reasoning model',
    provider: 'xai',
    modelId: 'grok-3-mini-beta',
  },
];

// Helper function to get the model's provider
export function getModelProvider(modelId: string): string {
  const model = chatModels.find((m) => m.id === modelId);
  return model?.provider || 'openai';
}

/**
 * Get available chat models without direct database imports
 * This is safe to use in both client and server components
 */
export async function getAvailableChatModels(): Promise<ChatModel[]> {
  try {
    // Import dynamically to avoid circular imports
    // Check if window is defined to determine if we're in browser context
    const isClient = typeof window !== 'undefined';

    if (isClient) {
      // In browser context, use fetch
      try {
        const response = await fetch('/api/chat/models');

        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.status}`);
        }

        const data = await response.json();

        // Flatten the providers object into a single array of models
        const models: ChatModel[] = [];
        for (const [_providerSlug, provider] of Object.entries(
          data.providers || {},
        )) {
          if (provider && Array.isArray((provider as any).models)) {
            models.push(...(provider as any).models);
          }
        }

        return models.length > 0 ? models : chatModels;
      } catch (error) {
        console.error('Error fetching models in client:', error);
        return chatModels;
      }
    } else {
      // In server context, directly import the database functions
      try {
        // Import the database functions dynamically
        const { getEnabledChatModels, getProviderById } = await import(
          '@/lib/db/queries'
        );
        const providerModels = await getEnabledChatModels();

        const models: ChatModel[] = [];

        for (const model of providerModels) {
          const provider = await getProviderById(model.providerId);
          if (!provider || !provider.enabled) continue;

          const modelConfig = model.config || {};
          models.push({
            id: `${provider.slug}-${model.modelId}`,
            name: model.name,
            description:
              typeof modelConfig === 'object' && 'description' in modelConfig
                ? String(modelConfig.description)
                : '',
            provider: provider.slug,
            modelId: model.modelId,
          });
        }

        return models;
      } catch (error) {
        console.error('Error fetching models in server:', error);
        return chatModels;
      }
    }
  } catch (error) {
    console.error('Error in getAvailableChatModels:', error);
    return chatModels;
  }
}

// Define image models for each provider
export interface ImageModel {
  id: string;
  provider: string;
  modelId: string;
  size?: string;
  quality?: 'standard' | 'hd';
}

export const imageModels: Record<string, ImageModel> = {
  openai: {
    id: 'openai-dalle3',
    provider: 'openai',
    modelId: 'dall-e-3',
    size: '1024x1024',
    quality: 'standard',
  },
  xai: {
    id: 'xai-grok2-image',
    provider: 'xai',
    modelId: 'grok-2-image',
  },
};

// Client/server compatible function to get provider configuration
export async function getProviderConfigStatus() {
  try {
    // Check if window is defined to determine if we're in browser context
    const isClient = typeof window !== 'undefined';

    if (isClient) {
      // In browser context, use fetch
      try {
        const response = await fetch('/api/admin-check');

        if (!response.ok) {
          throw new Error(
            `Failed to fetch provider config: ${response.status}`,
          );
        }

        const data = await response.json();
        return data.providers || getDefaultProviderConfig();
      } catch (error) {
        console.error('Error fetching provider config in client:', error);
        return getDefaultProviderConfig();
      }
    } else {
      // In server context, directly import the database functions
      try {
        // Import the database function dynamically
        const { getProviders } = await import('@/lib/db/queries');
        const providers = await getProviders();

        const result: Record<
          string,
          {
            fromEnv: boolean;
            apiKey: string | null;
            baseUrl: string | null;
          }
        > = {};

        // Convert DB providers to config status
        for (const provider of providers) {
          result[provider.slug] = {
            fromEnv: false, // Database providers are not from env
            apiKey: provider.apiKey ? '[CONFIGURED]' : null,
            baseUrl: provider.baseUrl || null,
          };
        }

        // Add environment variables for backwards compatibility
        const envProviders = {
          openai: {
            fromEnv: !!process.env.OPENAI_API_KEY,
            apiKey: process.env.OPENAI_API_KEY ? '[FROM ENV]' : null,
            baseUrl: process.env.OPENAI_BASE_URL || null,
          },
          xai: {
            fromEnv: !!process.env.XAI_API_KEY,
            apiKey: process.env.XAI_API_KEY ? '[FROM ENV]' : null,
            baseUrl: process.env.XAI_BASE_URL || null,
          },
          anthropic: {
            fromEnv: !!process.env.ANTHROPIC_API_KEY,
            apiKey: process.env.ANTHROPIC_API_KEY ? '[FROM ENV]' : null,
            baseUrl: process.env.ANTHROPIC_BASE_URL || null,
          },
          google: {
            fromEnv: !!process.env.GOOGLE_API_KEY,
            apiKey: process.env.GOOGLE_API_KEY ? '[FROM ENV]' : null,
            baseUrl: process.env.GOOGLE_BASE_URL || null,
          },
        };

        // Merge environment providers with database providers
        // Environment variables take precedence
        for (const [slug, config] of Object.entries(envProviders)) {
          if (config.fromEnv) {
            result[slug] = config;
          } else if (!result[slug]) {
            // Only add if not already in database
            result[slug] = config;
          }
        }

        return result;
      } catch (error) {
        console.error('Error fetching provider config in server:', error);
        return getDefaultProviderConfig();
      }
    }
  } catch (error) {
    console.error('Error in getProviderConfigStatus:', error);
    return getDefaultProviderConfig();
  }
}

// Default provider configuration as fallback
function getDefaultProviderConfig() {
  return {
    openai: {
      fromEnv: false,
      apiKey: null,
      baseUrl: null,
    },
    xai: {
      fromEnv: false,
      apiKey: null,
      baseUrl: null,
    },
    anthropic: {
      fromEnv: false,
      apiKey: null,
      baseUrl: null,
    },
    google: {
      fromEnv: false,
      apiKey: null,
      baseUrl: null,
    },
  };
}
