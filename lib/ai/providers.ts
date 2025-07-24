import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

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
        'chat-model': openai('gpt-4.1'),
        'chat-model-reasoning': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('gpt-4.1-nano'),
        'artifact-model': openai('gpt-4.1'),

        o3: openai('o3'),
      },
      imageModels: {
        'small-model': openai.imageModel('gpt-image-1'),
      },
    });
