import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { createOpenAI } from '@ai-sdk/openai';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

const isLocalMode = process.env.AI_GATEWAY_API_KEY === 'local';

// Create Ollama provider for local models
const ollamaProvider = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
});

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
        'anthropic-claude-3-5-sonnet': chatModel,
        'openai-gpt-4o': chatModel,
      },
    })
  : isLocalMode
    ? customProvider({
        languageModels: {
          'chat-model': ollamaProvider('qwen3:30b'),
          'chat-model-reasoning': wrapLanguageModel({
            model: ollamaProvider('qwen3:30b'),
            middleware: extractReasoningMiddleware({ tagName: 'think' }),
          }),
          'title-model': ollamaProvider('falcon3:latest'),
          'artifact-model': ollamaProvider('falcon3:latest'),
          'anthropic-claude-3-5-sonnet': ollamaProvider('qwen3:30b'),
          'openai-gpt-4o': ollamaProvider('falcon3:latest'),
        },
      })
    : customProvider({
        languageModels: {
          'chat-model': gateway.languageModel('xai/grok-2-vision-1212'),
          'chat-model-reasoning': wrapLanguageModel({
            model: gateway.languageModel('xai/grok-3-mini-beta'),
            middleware: extractReasoningMiddleware({ tagName: 'think' }),
          }),
          'title-model': gateway.languageModel('xai/grok-2-1212'),
          'artifact-model': gateway.languageModel('xai/grok-2-1212'),
          'anthropic-claude-3-5-sonnet': gateway.languageModel(
            'anthropic/claude-3-5-sonnet',
          ),
          'openai-gpt-4o': gateway.languageModel('openai/gpt-4o'),
        },
      });
