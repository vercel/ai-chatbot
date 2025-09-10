import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { openai } from '@ai-sdk/openai';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

const useDirectOpenAI = process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_API_KEY;

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : useDirectOpenAI
  ? customProvider({
      languageModels: {
        'chat-model': openai('gpt-4o-mini'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('gpt-5-mini'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('gpt-4o-mini'),
        'artifact-model': openai('gpt-4o-mini'),
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': gateway.languageModel('openai/gpt-4o-mini'),
        'chat-model-reasoning': wrapLanguageModel({
          model: gateway.languageModel('openai/gpt-5'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': gateway.languageModel('openai/gpt-4o-mini'),
        'artifact-model': gateway.languageModel('openai/gpt-4o-mini'),
      },
    });
