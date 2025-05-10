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

// Type for image models
type ImageModel = (prompt: string, options?: any) => any;

// Dynamically construct the imageModels object for customProvider
const registeredImageModels: Record<string, any> = {};

// Check if the AI SDK models include image generation capability
if (
  clientImageModels[PROVIDERS.OPENAI] &&
  typeof openai === 'function' &&
  'image' in openai
) {
  registeredImageModels[clientImageModels[PROVIDERS.OPENAI].id] = (
    openai as any
  ).image(clientImageModels[PROVIDERS.OPENAI].modelId);
}
if (
  clientImageModels[PROVIDERS.XAI] &&
  typeof xai === 'function' &&
  'image' in xai
) {
  registeredImageModels[clientImageModels[PROVIDERS.XAI].id] = (
    xai as any
  ).image(clientImageModels[PROVIDERS.XAI].modelId);
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
  : (() => {
      console.log(
        '[DEBUG] Attempting to initialize non-test myProvider. OPENAI_API_KEY:',
        process.env.OPENAI_API_KEY,
      );
      const modelId = 'gpt-4o';
      const modelKey = 'openai-gpt-4o';
      const openAIModelInstance = openai(modelId);
      console.log(
        `[DEBUG] OpenAI model instance for '${modelKey}' (from openai('${modelId}')) is:`,
        openAIModelInstance,
      );
      if (!openAIModelInstance) {
        console.error(
          `[DEBUG] CRITICAL: openai('${modelId}') returned a falsy value (undefined or null). Model will not be registered.`,
        );
      }
      return customProvider({
        languageModels: {
          [modelKey]: openAIModelInstance, // Using the instance
        },
        imageModels: registeredImageModels,
      });
    })();

console.log(
  '[DEBUG] myProvider defined. isTestEnvironment:',
  isTestEnvironment,
);
console.log(
  '[DEBUG] myProvider.languageModels:',
  myProvider.languageModels
    ? Object.keys(myProvider.languageModels)
    : 'undefined',
);

// This helper function might need to be updated or deprecated if image model selection
// is handled directly by selecting from `myProvider.imageModels` based on UI choice.
export function getImageModelForProvider(provider: string) {
  // Normalize the provider string
  const normalizedProvider = provider.toLowerCase();

  if (
    normalizedProvider === PROVIDERS.OPENAI &&
    clientImageModels[PROVIDERS.OPENAI]
  ) {
    return clientImageModels[PROVIDERS.OPENAI].id;
  }
  if (
    normalizedProvider === PROVIDERS.XAI &&
    clientImageModels[PROVIDERS.XAI]
  ) {
    return clientImageModels[PROVIDERS.XAI].id;
  }
  if (
    normalizedProvider === PROVIDERS.GOOGLE &&
    clientImageModels[PROVIDERS.GOOGLE]
  ) {
    return clientImageModels[PROVIDERS.GOOGLE].id;
  }
  console.warn(
    `No default image model found for provider: ${provider}. Falling back to OpenAI.`,
  );
  return clientImageModels[PROVIDERS.OPENAI]?.id || 'openai-dalle3';
}
