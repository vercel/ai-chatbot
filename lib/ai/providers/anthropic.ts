import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { isTestEnvironment } from '../../constants';
import { anthropic as provider } from '@ai-sdk/anthropic';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from '../models.test';

export const anthropic = isTestEnvironment
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
        'chat-model': provider('claude-3-7-sonnet-20250219'),
        'chat-model-reasoning': wrapLanguageModel({
          model: provider('claude-3-7-sonnet-20250219'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': provider('claude-3-7-sonnet-20250219'),
        'artifact-model': provider('claude-3-7-sonnet-20250219'),
      },
    });
