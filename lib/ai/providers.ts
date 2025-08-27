import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { gateway } from '@ai-sdk/gateway';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';
import { claudeSDK } from './providers/claude-sdk';

// Configuração do Claude SDK Provider
const claudeSDKProvider = claudeSDK({
  apiUrl: process.env.NEXT_PUBLIC_CLAUDE_SDK_API_URL || 
         process.env.CLAUDE_SDK_API_URL || 
         'http://127.0.0.1:8002'
});

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
        'claude-code-sdk': claudeSDKProvider.languageModel('claude-code-sdk'),
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
        'claude-code-sdk': claudeSDKProvider.languageModel('claude-code-sdk'),
      },
    });
