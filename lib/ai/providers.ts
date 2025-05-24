import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { togetherai } from '@ai-sdk/togetherai';
import { groq } from '@ai-sdk/groq';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// Model mapping for all providers
const getLanguageModel = (modelId: string) => {
  // Legacy models
  if (modelId === 'chat-model') return xai('grok-2-vision-1212');
  if (modelId === 'chat-model-reasoning') {
    return wrapLanguageModel({
      model: xai('grok-3-mini-beta'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  }

  // xAI models
  if (modelId === 'xai-grok-2-vision-1212') return xai('grok-2-vision-1212');
  if (modelId === 'xai-grok-2-1212') return xai('grok-2-1212');
  if (modelId === 'xai-grok-3-mini-beta') return xai('grok-3-mini-beta');

  // OpenAI models
  if (modelId === 'openai-gpt-4o') return openai('gpt-4o');
  if (modelId === 'openai-gpt-4o-mini') return openai('gpt-4o-mini');
  if (modelId === 'openai-gpt-4-turbo') return openai('gpt-4-turbo');
  if (modelId === 'openai-gpt-3.5-turbo') return openai('gpt-3.5-turbo');

  // Anthropic models
  if (modelId === 'anthropic-claude-3-5-sonnet-20241022') return anthropic('claude-3-5-sonnet-20241022');
  if (modelId === 'anthropic-claude-3-5-haiku-20241022') return anthropic('claude-3-5-haiku-20241022');
  if (modelId === 'anthropic-claude-3-opus-20240229') return anthropic('claude-3-opus-20240229');
  if (modelId === 'anthropic-claude-3-sonnet-20240229') return anthropic('claude-3-sonnet-20240229');

  // Google models
  if (modelId === 'google-gemini-1.5-pro') return google('gemini-1.5-pro');
  if (modelId === 'google-gemini-1.5-flash') return google('gemini-1.5-flash');
  if (modelId === 'google-gemini-1.0-pro') return google('gemini-1.0-pro');

  // Mistral models
  if (modelId === 'mistral-large-latest') return mistral('mistral-large-latest');
  if (modelId === 'mistral-medium-latest') return mistral('mistral-medium-latest');
  if (modelId === 'mistral-small-latest') return mistral('mistral-small-latest');

  // Together.ai models
  if (modelId === 'togetherai-meta-llama-3.1-70b-instruct-turbo') return togetherai('meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo');
  if (modelId === 'togetherai-meta-llama-3.1-8b-instruct-turbo') return togetherai('meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo');
  if (modelId === 'togetherai-mistralai-mixtral-8x7b-instruct-v0.1') return togetherai('mistralai/Mixtral-8x7B-Instruct-v0.1');
  if (modelId === 'togetherai-codellama-34b-instruct') return togetherai('codellama/CodeLlama-34b-Instruct-hf');

  // Groq models
  if (modelId === 'groq-llama-3.1-70b-versatile') return groq('llama-3.1-70b-versatile');
  if (modelId === 'groq-llama-3.1-8b-instant') return groq('llama-3.1-8b-instant');
  if (modelId === 'groq-mixtral-8x7b-32768') return groq('mixtral-8x7b-32768');
  if (modelId === 'groq-gemma-7b-it') return groq('gemma-7b-it');

  // Default fallback
  return xai('grok-2-1212');
};

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
        // Legacy models
        'chat-model': getLanguageModel('chat-model'),
        'chat-model-reasoning': getLanguageModel('chat-model-reasoning'),
        'title-model': xai('grok-2-1212'),
        'artifact-model': xai('grok-2-1212'),

        // All new models
        'xai-grok-2-vision-1212': getLanguageModel('xai-grok-2-vision-1212'),
        'xai-grok-2-1212': getLanguageModel('xai-grok-2-1212'),
        'xai-grok-3-mini-beta': getLanguageModel('xai-grok-3-mini-beta'),

        'openai-gpt-4o': getLanguageModel('openai-gpt-4o'),
        'openai-gpt-4o-mini': getLanguageModel('openai-gpt-4o-mini'),
        'openai-gpt-4-turbo': getLanguageModel('openai-gpt-4-turbo'),
        'openai-gpt-3.5-turbo': getLanguageModel('openai-gpt-3.5-turbo'),

        'anthropic-claude-3-5-sonnet-20241022': getLanguageModel('anthropic-claude-3-5-sonnet-20241022'),
        'anthropic-claude-3-5-haiku-20241022': getLanguageModel('anthropic-claude-3-5-haiku-20241022'),
        'anthropic-claude-3-opus-20240229': getLanguageModel('anthropic-claude-3-opus-20240229'),
        'anthropic-claude-3-sonnet-20240229': getLanguageModel('anthropic-claude-3-sonnet-20240229'),

        'google-gemini-1.5-pro': getLanguageModel('google-gemini-1.5-pro'),
        'google-gemini-1.5-flash': getLanguageModel('google-gemini-1.5-flash'),
        'google-gemini-1.0-pro': getLanguageModel('google-gemini-1.0-pro'),

        'mistral-large-latest': getLanguageModel('mistral-large-latest'),
        'mistral-medium-latest': getLanguageModel('mistral-medium-latest'),
        'mistral-small-latest': getLanguageModel('mistral-small-latest'),

        'togetherai-meta-llama-3.1-70b-instruct-turbo': getLanguageModel('togetherai-meta-llama-3.1-70b-instruct-turbo'),
        'togetherai-meta-llama-3.1-8b-instruct-turbo': getLanguageModel('togetherai-meta-llama-3.1-8b-instruct-turbo'),
        'togetherai-mistralai-mixtral-8x7b-instruct-v0.1': getLanguageModel('togetherai-mistralai-mixtral-8x7b-instruct-v0.1'),
        'togetherai-codellama-34b-instruct': getLanguageModel('togetherai-codellama-34b-instruct'),

        'groq-llama-3.1-70b-versatile': getLanguageModel('groq-llama-3.1-70b-versatile'),
        'groq-llama-3.1-8b-instant': getLanguageModel('groq-llama-3.1-8b-instant'),
        'groq-mixtral-8x7b-32768': getLanguageModel('groq-mixtral-8x7b-32768'),
        'groq-gemma-7b-it': getLanguageModel('groq-gemma-7b-it'),
      },
      imageModels: {
        'small-model': xai.image('grok-2-image'),
      },
    });
