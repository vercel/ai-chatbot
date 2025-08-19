import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';
import { gateway } from '@ai-sdk/gateway';

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
        'chat-model': gateway('grok-2-vision-1212'),
        'chat-model-reasoning': wrapLanguageModel({
          model: gateway('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': gateway('grok-2-1212'),
        'artifact-model': gateway('grok-2-1212'),
      },
      imageModels: {
        'small-model': xai.imageModel('grok-2-image'),
      },
    });
