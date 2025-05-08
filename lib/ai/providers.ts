import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { chatModels, imageModels } from './models';

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
      languageModels: {
        // OpenAI Models
        'openai-gpt4o': openai('gpt-4o'),
        'openai-o3mini': openai('o3-mini'),
        'openai-reasoning': wrapLanguageModel({
          model: openai('gpt-4o'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        
        // xAI Models
        'xai-grok2': xai('grok-2-1212'),
        'xai-grok2-vision': xai('grok-2-vision-1212'),
        'xai-grok3-mini': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        
        // Legacy model IDs (for backward compatibility)
        'chat-model': openai('gpt-4o'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('gpt-4o'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('gpt-3.5-turbo'),
        'artifact-model': openai('gpt-4o'),
      },
      imageModels: {
        'openai-dalle3': openai.image('dall-e-3'),
        'xai-grok2-image': xai.image('grok-2-image'),
        // Legacy model ID
        'small-model': openai.image('dall-e-3'),
      },
    });

// Helper function to get the appropriate image model based on the provider
export function getImageModelForProvider(provider: 'openai' | 'xai') {
  return provider === 'openai' ? 'openai-dalle3' : 'xai-grok2-image';
}
