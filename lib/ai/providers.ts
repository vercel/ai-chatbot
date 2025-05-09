import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import {
  PROVIDERS,
  imageModels as clientImageModels,
} from '../ai/client-models';

// Helper function to check if provider API keys are in environment variables
export function isProviderConfiguredByEnv(providerSlug: string): boolean {
  switch (providerSlug.toLowerCase()) {
    case PROVIDERS.OPENAI:
      return !!process.env.OPENAI_API_KEY;
    case PROVIDERS.XAI:
      return !!process.env.XAI_API_KEY;
    case PROVIDERS.GOOGLE:
      return (
        !!process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        !!process.env.GOOGLE_API_KEY
      );
    case PROVIDERS.ANTHROPIC:
      return !!process.env.ANTHROPIC_API_KEY;
    default:
      return false;
  }
}

// New function to configure providers with API keys from DB
export async function getProviderConfig(providerSlug: string) {
  // First check environment variables
  if (isProviderConfiguredByEnv(providerSlug)) {
    console.log(`Using ${providerSlug} API key from environment variables`);
    return null; // Will use environment variables by default if SDKs are set up for it
  }

  try {
    // If not in environment, try database
    const { getProviderBySlug } = await import('@/lib/db/queries');
    const provider = await getProviderBySlug(providerSlug);

    if (provider?.apiKey) {
      console.log(`Using ${providerSlug} API key from database`);
      // Return configuration object for the provider SDK
      return {
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl || undefined,
      };
    }

    console.warn(
      `No API key found for ${providerSlug} in environment or database. Some SDK functions might not work directly without explicit configuration. It might fall back to global SDK config if available (e.g. from Vercel Env Vars).`,
    );
    return null;
  } catch (error) {
    console.error(`Error getting ${providerSlug} config from database:`, error);
    return null;
  }
}

// Dynamically construct the imageModels object for customProvider
const registeredImageModels: Record<string, any> = {};

if (clientImageModels[PROVIDERS.OPENAI] && openai.image) {
  registeredImageModels[clientImageModels[PROVIDERS.OPENAI].id] = openai.image(
    clientImageModels[PROVIDERS.OPENAI].modelId,
  );
}
if (clientImageModels[PROVIDERS.XAI] && xai.image) {
  registeredImageModels[clientImageModels[PROVIDERS.XAI].id] = xai.image(
    clientImageModels[PROVIDERS.XAI].modelId,
  );
}
// Google image generation is typically part of a multimodal generateText call,
// not a separate .image() model like OpenAI/XAI via the core AI SDK customProvider structure.
// So, we don't register google.image() here in the same way.
// If a specific Google *image model endpoint* is exposed via their SDK and you want to use it directly,
// that would require a different setup or a custom wrapper.

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
      imageModels: {},
    })
  : customProvider({
      languageModels: {
        // OpenAI Models
        'openai-gpt-4o': openai('gpt-4o'),
        'openai-gpt-4o-mini': openai('gpt-4o-mini'),
        'openai-o1': openai('o1'),
        'openai-o1-mini': openai('o1-mini'),
        'openai-o1-preview': openai('o1-preview'),
        'openai-gpt-4': openai('gpt-4'),
        'openai-gpt-4-turbo': openai('gpt-4-turbo'),
        'openai-gpt-3.5-turbo': openai('gpt-3.5-turbo'),
        'openai-gpt-4.1': openai('gpt-4.1'),

        // OpenAI aliases (for compatibility)
        'openai-gpt4o': openai('gpt-4o'),
        'openai-o3mini': openai('gpt-4o-mini'),
        'openai-gpt4': openai('gpt-4'),
        'openai-gpt35turbo': openai('gpt-3.5-turbo'),
        'openai-gpt41': openai('gpt-4.1'),

        'openai-reasoning': wrapLanguageModel({
          model: openai('gpt-4o'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),

        // xAI Models
        'xai-grok-2-1212': xai('grok-2-1212'),
        'xai-grok-2-vision-1212': xai('grok-2-vision-1212'),
        'xai-grok-3-mini-beta': xai('grok-3-mini-beta'),

        // xAI aliases (for compatibility)
        'xai-grok2': xai('grok-2-1212'),
        'xai-grok2-vision': xai('grok-2-vision-1212'),
        'xai-grok3-mini': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),

        // Google Models (ensure you have @ai-sdk/google or similar installed)
        'google-gemini-1.5-pro': google('gemini-1.5-pro-latest'),
        'google-gemini-1.5-flash': google('gemini-1.5-flash-latest'),

        // Legacy model IDs (for backward compatibility)
        'chat-model': openai('gpt-4o'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('gpt-4o'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('gpt-3.5-turbo'),
        'artifact-model': openai('gpt-4o'),
      },
      imageModels: registeredImageModels,
    });

// This helper function might need to be updated or deprecated if image model selection
// is handled directly by selecting from `myProvider.imageModels` based on UI choice.
export function getImageModelForProvider(
  provider: 'openai' | 'xai' | 'google',
) {
  if (provider === PROVIDERS.OPENAI && clientImageModels[PROVIDERS.OPENAI]) {
    return clientImageModels[PROVIDERS.OPENAI].id;
  }
  if (provider === PROVIDERS.XAI && clientImageModels[PROVIDERS.XAI]) {
    return clientImageModels[PROVIDERS.XAI].id;
  }
  if (provider === PROVIDERS.GOOGLE && clientImageModels[PROVIDERS.GOOGLE]) {
    return clientImageModels[PROVIDERS.GOOGLE].id;
  }
  console.warn(
    `No default image model found for provider: ${provider}. Falling back to OpenAI.`,
  );
  return clientImageModels[PROVIDERS.OPENAI]?.id || 'openai-dalle3';
}
