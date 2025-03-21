import { xai } from '@ai-sdk/xai';
import { groq } from '@ai-sdk/groq';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export const myProvider = customProvider({
  languageModels: {
    'chat-model': xai('grok-2-1212'),
    'chat-model-reasoning': wrapLanguageModel({
      model: groq('deepseek-r1-distill-llama-70b'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': xai('grok-2-1212'),
    'block-model': xai('grok-2-1212'),
  },
  imageModels: {
    'small-model': xai.image('grok-2-image'),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
  requiresAuth: boolean;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Chat model',
    description: 'Primary model for all-purpose chat',
    requiresAuth: false,
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
    requiresAuth: false,
  },
];
