import { customProvider } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { artifactModel, chatModel, titleModel } from './models.test';
import { isTestEnvironment } from '../constants';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        // Use gateway with your chosen OpenAI models
        'chat-model': gateway.languageModel('openai/gpt-5'),
        'title-model': gateway.languageModel('openai/gpt-4.1-nano'),
        'artifact-model': gateway.languageModel('openai/gpt-4.1'),
        // Add Gemini 2.5 Flash as a multimodal language model
        'gemini-multimodal': gateway.languageModel(
          'google/gemini-2.5-flash-image-preview',
        ),
      },
    });
