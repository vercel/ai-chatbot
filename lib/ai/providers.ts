import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

import { gateway } from '@ai-sdk/gateway'
import { isTestEnvironment } from '../constants';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
        'web-automation-model': chatModel, // Use same test model for web automation
        'benefit-applications-agent': chatModel, // Use same test model for benefit applications
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': openai('gpt-4o'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('gpt-4o'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('gpt-4o-mini'),
        'artifact-model': openai('gpt-4o'),
        // 'web-automation-model' is handled by Mastra agent, not this provider
        // 'benefit-applications-agent' is handled by Mastra agent, not this provider
      },
      imageModels: {
        'small-model': openai.image('dall-e-3'),
      },
    });
