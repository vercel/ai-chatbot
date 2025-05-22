import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
// import { groq } from '@ai-sdk/groq';
// import { xai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google';
// import { fal } from '@ai-sdk/fal';
import { togetherai } from '@ai-sdk/togetherai';
import { openai, OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
// import { fireworks } from '@ai-sdk/fireworks';
// import { replicate } from '@ai-sdk/replicate';
// import { elevenlabs } from '@ai-sdk/elevenlabs';
// import { deepgram } from '@ai-sdk/deepgram';
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
        'chat-model': openai('gpt-4.1'),
        'chat-model-reasoning': openai('o3'),
        // 'chat-model': google('gemini-2.5-flash-preview-04-17'),
        // 'chat-model-reasoning': wrapLanguageModel({
        //   model: fireworks('accounts/fireworks/models/deepseek-r1'),
        //   middleware: extractReasoningMiddleware({ tagName: 'think' }),
        // }),
        'title-model': google('gemini-2.5-flash-preview-04-17'),
        'artifact-model': google('gemini-2.5-pro-preview-03-25'),
        'deepseek-v3': togetherai('deepseek-ai/DeepSeek-V3'),
        'deepseek-r1': togetherai('deepseek-ai/DeepSeek-R1'),
        'gemini-2.5-flash-preview-04-17': google(
          'gemini-2.5-flash-preview-04-17',
        ),
        'gemini-2.5-pro-preview-03-25': google('gemini-2.5-pro-preview-03-25'),
        'o4-mini': openai('o4-mini'),
        'claude-sonnet-4': anthropic('claude-sonnet-4-20250514'),
        'claude-opus-4': anthropic('claude-opus-4-20250514'),
      },
      imageModels: {
        // 'small-model': fal.image('fal-ai/recraft-v3'), // Commented out Fal model
        'gpt-image-1': openai.image('gpt-image-1'), // Added OpenAI gpt-image-1
        'dall-e-3': openai.image('dall-e-3'), // Added OpenAI dall-e-3
      },
    });
