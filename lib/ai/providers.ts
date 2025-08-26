import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': openrouter.chat('openai/gpt-5-nano:online'),
        'chat-model-reasoning': openrouter.chat('openai/gpt-5-nano'),
        'title-model': openrouter.chat('openai/gpt-5-nano'),
        'artifact-model': openrouter.chat('openai/gpt-5-nano'),
        'suggestion-model': openrouter.chat('mistralai/ministral-8b'),
        'chat-model-web-search': openrouter.chat('openai/gpt-5-nano:online'),
        'enhancement-model': openrouter.chat('mistralai/ministral-8b')
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': openrouter.chat('openai/gpt-5-nano:online'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openrouter.chat('openai/gpt-5-nano'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openrouter.chat('openai/gpt-5-nano'),
        'artifact-model': openrouter.chat('openai/gpt-5-nano'),
        'suggestion-model': openrouter.chat('mistralai/ministral-8b'),
        'chat-model-web-search': openrouter.chat('openai/gpt-5-nano:online'),
        'enhancement-model': openrouter.chat('mistralai/ministral-8b')
      },
    });
