import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
// import { xai } from '@ai-sdk/xai';
import { bedrock } from '@ai-sdk/amazon-bedrock';
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
        'chat-model': bedrock('us.anthropic.claude-3-5-sonnet-20241022-v2:0'),
        'chat-model-reasoning': wrapLanguageModel({
          model: bedrock('us.anthropic.claude-3-5-sonnet-20241022-v2:0'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': bedrock('us.anthropic.claude-3-5-sonnet-20241022-v2:0'),
        'artifact-model': bedrock('us.anthropic.claude-3-5-sonnet-20241022-v2:0'),
      },
      // imageModels: {
      //   'small-model': bedrock('gpt-4o'),
      // },
    });
