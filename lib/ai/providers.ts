import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,

  generateText
} from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { xai } from '@ai-sdk/xai';
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
        'chat-model': gateway('xai/grok-4'),
     
        'chat-model-reasoning': wrapLanguageModel({
          'model': gateway('moonshotai/kimi-k2'),
          'middleware': extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': xai('grok-4'),
        'artifact-model': xai('grok-4'),
      },
      imageModels: {
        'small-model': xai.imageModel('grok-2-image'),
      },
    });
