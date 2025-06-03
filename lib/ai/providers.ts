import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
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
        // Legacy models for backward compatibility
        'chat-model': openai('gpt-4o'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('o1-mini'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('gpt-4o-mini'),
        'artifact-model': openai('gpt-4o'),

        // ChatGPT (OpenAI) Models
        'gpt-4o': openai('gpt-4o'),
        'gpt-4.1': openai('gpt-4.1'),
        'gpt-4.5': openai('gpt-4.5'),
        o1: openai('o1'),
        'o1-mini': openai('o1-mini'),
        o3: openai('o3'),
        'o3-mini': openai('o3-mini'),
        'o4-mini': openai('gpt-4o-mini'),
        'o4-mini-high': openai('gpt-4o'),

        // Gemini (Google DeepMind) Models
        'gemini-2.5-pro': google('models/gemini-2.5-pro'),
        'gemini-2.5-flash': google('models/gemini-2.5-flash'),
        'gemini-2.0-flash': google('models/gemini-2.0-flash'),
        'gemini-2.0-flash-lite': google('models/gemini-2.0-flash-lite'),
        'gemini-1.5-pro': google('models/gemini-1.5-pro'),
        'gemini-1.5-flash': google('models/gemini-1.5-flash'),
        'gemini-1.0-flash': google('models/gemini-1.0-flash'),

        // Claude (Anthropic) Models
        'claude-opus-4': anthropic('claude-3-5-sonnet-latest'),
        'claude-sonnet-4': anthropic('claude-3-5-sonnet-latest'),
        'claude-3.7-sonnet': anthropic('claude-3-7-sonnet-latest'),
        'claude-3.5-sonnet-v2': anthropic('claude-3-5-sonnet-v2-latest'),
        'claude-3.5-haiku': anthropic('claude-3-5-haiku-latest'),
      },
      imageModels: {
        'small-model': openai.image('dall-e-3'),
      },
    });
