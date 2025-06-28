import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// Swap to OpenAI models in production, keep test mocks for test env
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
        // Main chat model: GPT-4o
        'chat-model': openai('gpt-4o'),
        // Reasoning model: GPT-4 Turbo with reasoning middleware
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('gpt-4-turbo'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        // Title and artifact models: GPT-3.5 Turbo
        'title-model': openai('gpt-3.5-turbo'),
        'artifact-model': openai('gpt-3.5-turbo'),
      },
      imageModels: {
        // DALL·E 3 for image generation
        'small-model': openai.image('dall-e-3'),
      },
      textEmbeddingModels: {
        'embedding-model': openai.textEmbeddingModel('text-embedding-ada-002'),
      }
    });
