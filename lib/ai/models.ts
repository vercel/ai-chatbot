import { createOpenAI } from '@ai-sdk/openai';
import { fireworks } from '@ai-sdk/fireworks';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

const openai = createOpenAI({
   'baseURL': 'http://localhost:11434/v1',
   'apiKey': 'dontcare'
})

export const DEFAULT_CHAT_MODEL: string = 'chat-model-small';

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': openai('llama3.2:1b'),
    'chat-model-large': openai('llama3.2:1b'),
    'title-model': openai('llama3.2:1b')
  }
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'Llama3.2:1b',
    description: 'Small model for fast, lightweight tasks',
  }
];

