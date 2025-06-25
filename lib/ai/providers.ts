import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { openai } from '@ai-sdk/openai';
import { createPortkey } from '@portkey-ai/vercel-provider';


const portkey = createPortkey({
  apiKey: process.env.PORTKEY_API_KEY,
  config: process.env.PORTKEY_API_CONFIG
});

// const openaiModel = openai('gpt-4-1-mini');
const chatModel= portkey.chatModel('us.anthropic.claude-sonnet-4-20250514-v1:0')



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
        'chat-model': chatModel,
        'chat-model-reasoning': wrapLanguageModel({
          model: chatModel,
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': chatModel,
        'artifact-model': chatModel,
      },
      imageModels: {
        'small-model': openai.image('gpt-4o-mini'),
      },
    });
