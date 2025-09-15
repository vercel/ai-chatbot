import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
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
        'chat-model': openai.languageModel('gpt-5'),
        'title-model': openai.languageModel('gpt-4.1-nano'),
        'artifact-model': openai.languageModel('gpt-4.1'),
      },
    });
