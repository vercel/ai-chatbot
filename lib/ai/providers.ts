import { customProvider } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { isTestEnvironment } from '../constants';

export const myProvider = isTestEnvironment
  ? (() => {
      const { artifactModel, chatModel, titleModel } = require('./models.test');
      return customProvider({
        languageModels: {
          'chat-model': chatModel,
          'title-model': titleModel,
          'artifact-model': artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        // Use gateway with your chosen OpenAI models
        'chat-model': gateway.languageModel('openai/gpt-5'),
        'title-model': gateway.languageModel('openai/gpt-4.1-nano'),
        'artifact-model': gateway.languageModel('openai/gpt-4.1'),
      },
    });
