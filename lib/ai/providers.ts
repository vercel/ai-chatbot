import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';
import { chatModels, legacyModelMap, type ModelProvider } from './models';

interface ProviderConfig {
  enabled: boolean;
  apiKey?: string;
}

export interface ProvidersConfig {
  openai: ProviderConfig;
  anthropic: ProviderConfig;
  google: ProviderConfig;
}

export const getProvidersConfig = (): ProvidersConfig => {
  const config = {
    openai: {
      enabled: !!process.env.OPENAI_API_KEY,
      apiKey: process.env.OPENAI_API_KEY,
    },
    anthropic: {
      enabled: !!process.env.ANTHROPIC_API_KEY,
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    google: {
      enabled: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
  };

  // Comprehensive debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Environment Variables Debug:');
    console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `✅ Set (${process.env.OPENAI_API_KEY.substring(0, 10)}...)` : '❌ Not set');
    console.log('  ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? `✅ Set (${process.env.ANTHROPIC_API_KEY.substring(0, 10)}...)` : '❌ Not set');
    console.log('  GOOGLE_GENERATIVE_AI_API_KEY:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? `✅ Set (${process.env.GOOGLE_GENERATIVE_AI_API_KEY.substring(0, 10)}...)` : '❌ Not set');
    
    console.log('🏭 Provider Configuration:');
    console.log('  OpenAI enabled:', config.openai.enabled);
    console.log('  Anthropic enabled:', config.anthropic.enabled);
    console.log('  Google enabled:', config.google.enabled);
  }

  return config;
};

const createProviderModel = (modelId: string, provider: ModelProvider) => {
  const config = getProvidersConfig();
  
  switch (provider) {
    case 'openai':
      if (!config.openai.enabled) {
        throw new Error('OpenAI provider is not configured');
      }
      
      return openai(modelId);
      
    case 'anthropic':
      if (!config.anthropic.enabled) {
        throw new Error('Anthropic provider is not configured');
      }
      return anthropic(modelId);
      
    case 'google':
      if (!config.google.enabled) {
        throw new Error('Google provider is not configured');
      }
      return google(modelId);
      
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
};

const createLanguageModels = () => {
  const models: Record<string, any> = {};
  const config = getProvidersConfig();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🚀 Starting Model Registration Process...');
    console.log(`📊 Total models defined: ${chatModels.length}`);
    
    const modelsByProvider = chatModels.reduce((acc, model) => {
      acc[model.provider] = (acc[model.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📈 Models by provider:', modelsByProvider);
  }
  
  let successCount = 0;
  let failureCount = 0;
  const failedModels: string[] = [];
  
  // Add all available models
  for (const model of chatModels) {
    const providerEnabled = config[model.provider].enabled;
    
    if (!providerEnabled) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏭️ Skipping ${model.id} - ${model.provider} provider disabled`);
      }
      continue;
    }
    
    try {
      // Modern reasoning models (o3, o4) have different capabilities than legacy o1 models
      const isModernReasoningModel = model.id.startsWith('o3') || model.id.startsWith('o4-');
      const hasReasoningMiddleware = model.capabilities.reasoning && model.provider === 'openai' && !isModernReasoningModel;
      
      if (hasReasoningMiddleware) {
        // Apply reasoning middleware for GPT-5 and other non-reasoning OpenAI models
        models[model.id] = wrapLanguageModel({
          model: createProviderModel(model.id, model.provider),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        });
      } else {
        // Use plain model for o3/o4 reasoning models and non-reasoning models
        models[model.id] = createProviderModel(model.id, model.provider);
      }
      
      successCount++;
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${model.id} (${model.provider}) - ${hasReasoningMiddleware ? 'with middleware' : 'plain model'}`);
      }
    } catch (error) {
      failureCount++;
      failedModels.push(model.id);
      console.error(`❌ Failed to configure ${model.id} (${model.provider}):`, error);
    }
  }
  
  // Add legacy model mappings for backward compatibility
  for (const [legacyId, newId] of Object.entries(legacyModelMap)) {
    if (models[newId]) {
      models[legacyId] = models[newId];
    }
  }
  
  // Add utility models and special handling
  if (config.openai.enabled) {
    // Add utility models
    models['title-model'] = openai('gpt-4o-mini');
    models['artifact-model'] = openai('gpt-4o');
  }
  
  // Special handling for legacy reasoning model
  if (!models['chat-model-reasoning']) {
    if (config.openai.enabled) {
      // Use o4-mini as the new default reasoning model
      models['chat-model-reasoning'] = openai('o4-mini');
    } else if (config.anthropic.enabled) {
      // Fallback to Claude 3.7 Sonnet if OpenAI not available
      models['chat-model-reasoning'] = anthropic('claude-3-7-sonnet-20250219');
    }
  }
  
  // If no models are available, add test models as fallback
  if (Object.keys(models).length === 0) {
    const { chatModel, reasoningModel, titleModel, artifactModel } = require('./models.test');
    models['chat-model'] = chatModel;
    models['chat-model-reasoning'] = reasoningModel;
    models['title-model'] = titleModel;
    models['artifact-model'] = artifactModel;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ No provider models available, using test fallbacks');
    }
  }
  
  // Final summary
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📋 Model Registration Summary:');
    console.log(`✅ Successfully configured: ${successCount} models`);
    console.log(`❌ Failed to configure: ${failureCount} models`);
    if (failedModels.length > 0) {
      console.log(`🚫 Failed models: ${failedModels.join(', ')}`);
    }
    console.log(`🎯 Total available models: ${Object.keys(models).length}`);
    console.log(`📝 Available model IDs: ${Object.keys(models).sort().join(', ')}`);
    console.log('🏁 Model registration complete!\n');
  }
  
  return models;
};

const createImageModels = () => {
  const config = getProvidersConfig();
  const models: Record<string, any> = {};
  
  if (config.openai.enabled) {
    models['small-model'] = openai('dall-e-3');
  }
  
  return models;
};

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: createLanguageModels(),
      imageModels: createImageModels(),
    });
