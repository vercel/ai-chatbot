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
        'chat-model': openrouter.chat('deepseek/deepseek-chat-v3.1'),
        'chat-model-reasoning': openrouter.chat('deepseek/deepseek-r1'),
        'title-model': openrouter.chat('deepseek/deepseek-chat-v3.1'),
        'artifact-model': openrouter.chat('deepseek/deepseek-chat-v3.1'),
        'suggestion-model': openrouter.chat('mistralai/ministral-8b'),
        'web-search-model': openrouter.chat('openai/gpt-4o-mini')
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': openrouter.chat('deepseek/deepseek-chat-v3.1'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openrouter.chat('deepseek/deepseek-r1'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openrouter.chat('deepseek/deepseek-chat-v3.1'),
        'artifact-model': openrouter.chat('deepseek/deepseek-chat-v3.1'),
        'suggestion-model': openrouter.chat('mistralai/ministral-8b'),
        'web-search-model': openrouter.chat('openai/gpt-4o-mini')
      },
    });
