import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { groq } from '@ai-sdk/groq';
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
        'chat-llama3.3-70b-specdec': groq('llama-3.3-70b-specdec'),
        'chat-qwen2.5-32b': groq('qwen-2.5-32b'),
        'chat-model-reasoning': wrapLanguageModel({
          model: groq('deepseek-r1-distill-qwen-32b'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': groq('qwen-2.5-32b'),
        'artifact-model': groq('llama3-70b-8192'),
      },
      imageModels: {},
    });
