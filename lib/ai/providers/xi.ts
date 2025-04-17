import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai as provider } from '@ai-sdk/xai';
import { isTestEnvironment } from '../../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from '../models.test';

export const xai = isTestEnvironment
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
        'chat-model': provider('grok-2-1212'),
        'chat-model-reasoning': wrapLanguageModel({
          model: provider('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': provider('grok-2-1212'),
        'artifact-model': provider('grok-2-1212'),
      },
      imageModels: {
        'small-model': provider.image('grok-2-image'),
      },
    });
