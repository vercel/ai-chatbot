import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
  type LanguageModel,
  type ImageModel,
} from 'ai';
import { isTestEnvironment } from '../constants'; // Corrected path
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
  // Assuming no specific test models for Gemini yet
  // testGeminiProModel,
  // testGeminiFlashModel,
} from './models.test';

// --- Define Production Provider Models ---

// Google Models
const googleLanguageModels: Record<string, LanguageModel> = {
  'gemini-2.5-pro-preview-05-06': google('gemini-2.5-pro-preview-05-06'),
  'gemini-2.5-flash-preview-05-06': google('gemini-2.5-flash-preview-05-06'),
};

// XAI Models
const xaiLanguageModels: Record<string, LanguageModel> = {
  // Maps providerModelId from models.ts to the actual model instance
  'grok-2-vision-1212': xai('grok-2-vision-1212'), // Used by 'grok-chat'
  'grok-3-mini-beta': wrapLanguageModel({        // Used by 'grok-reasoning'
    model: xai('grok-3-mini-beta'),
    middleware: extractReasoningMiddleware({ tagName: 'think' }),
  }),
  'grok-2-1212': xai('grok-2-1212'),          // Used by 'grok-title', 'grok-artifact'
};
const xaiImageModels: Record<string, ImageModel> = {
  // Assuming 'grok-2-image' is the providerModelId for the image model in models.ts
  'grok-2-image': xai.image('grok-2-image'),
};

// --- Define Test Provider Models ---
const testLanguageModels: Record<string, LanguageModel> = {
  // Maps internal model IDs (like 'grok-chat') from models.ts to test models
  'grok-chat': chatModel,
  'grok-reasoning': reasoningModel,
  'grok-title': titleModel,
  'grok-artifact': artifactModel,
  // Add mappings for Gemini test models if/when available
  // 'gemini-quantum': testGeminiProModel, // Example
  // 'gemini-vision-pro': testGeminiProModel, // Example
  // 'gemini-flash': testGeminiFlashModel, // Example
};
// Define testImageModels if needed (e.g., if Grok image model needs testing)
// const testImageModels: Record<string, ImageModel> = {
//   'grok-image': testImageModel, // Replace testImageModel with actual import
// };


// --- Create Provider Instances ---

const googleProviderInstance = customProvider({ languageModels: googleLanguageModels });
const xaiProviderInstance = customProvider({ languageModels: xaiLanguageModels, imageModels: xaiImageModels });
// Include testImageModels if defined above
const testProviderInstance = customProvider({ languageModels: testLanguageModels /*, imageModels: testImageModels */ });


// --- Export Providers ---

export const configuredProviders = isTestEnvironment
  ? {
      // Map provider names to the single test instance
      google: testProviderInstance, // Gemini models might fail here if no test models are mapped
      xai: testProviderInstance,
      test: testProviderInstance, // Explicitly export test provider if needed
    }
  : {
      google: googleProviderInstance,
      xai: xaiProviderInstance,
    };

// Optional: Helper function to get a provider instance by name
export function getProvider(providerName: 'google' | 'xai' | 'test'): ReturnType<typeof customProvider> | undefined {
  // Ensure the key exists before accessing in test environment case
  if (isTestEnvironment) {
    return providerName === 'google' || providerName === 'xai' || providerName === 'test'
      ? testProviderInstance
      : undefined;
  }
  // Access directly in production environment
  return configuredProviders[providerName as keyof typeof configuredProviders];
}
