import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

import { groq } from '@ai-sdk/groq';
import { google } from '@ai-sdk/google';

import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

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
        'chat-llama3-70b': groq('llama3-70b-8192'),
        'chat-llama3.3-70b-versatile': groq('llama-3.3-70b-versatile'),
        'chat-qwen2.5-32b': groq('qwen-2.5-32b'),
        'chat-gemini-2.0-flash-lite': google('gemini-2.0-flash-lite'),
        'chat-gemini-1.5-flash-8b': google('gemini-1.5-flash-8b'),
        'chat-gemini-2.0-flash': google('gemini-2.0-flash'),
        'chat-gemini-2.0-flash-search': google('gemini-2.0-flash', {
          useSearchGrounding: true,
        }),
        'chat-model-reasoning': wrapLanguageModel({
          model: groq('deepseek-r1-distill-qwen-32b'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': groq('qwen-2.5-32b'),
        'artifact-model': groq('llama3-70b-8192'),
      },
      imageModels: {},
    });
