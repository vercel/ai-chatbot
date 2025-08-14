import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
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
        // Use standard OpenAI chat model id; reasoning is enabled via providerOptions
        'chat-model': openai.responses('gpt-5'),
        'title-model': openai('gpt-4.1-nano'),
        'artifact-model': openai('gpt-4.1'),
      },
      imageModels: {
        'small-model': openai.imageModel('gpt-image-1'),
      },
    });
