import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { createTogetherAI } from '@ai-sdk/togetherai';

const togetherAIKey = process.env.TOGETHER_AI_API_KEY;

if (!togetherAIKey && !isTestEnvironment) {
  throw new Error('TOGETHER_AI_API_KEY environment variable is required');
}

// Initialize Together.ai with the API key
const togetherai = createTogetherAI({
  apiKey: togetherAIKey ?? '',
});

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
        'chat-model': togetherai('mistralai/Mixtral-8x7B-Instruct-v0.1'),
        'chat-model-reasoning': wrapLanguageModel({
          model: togetherai('mistralai/Mixtral-8x7B-Instruct-v0.1'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': togetherai('mistralai/Mixtral-8x7B-Instruct-v0.1'),
        'artifact-model': togetherai('mistralai/Mixtral-8x7B-Instruct-v0.1'),
      },
      imageModels: {
        'small-model': togetherai.image('stabilityai/stable-diffusion-xl-base-1.0'),
      },
    });
