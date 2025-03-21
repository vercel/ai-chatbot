import { openai } from '@ai-sdk/openai';
import { customProvider } from 'ai';
// Add caching for better performance
import { cache } from 'react';

export const DEFAULT_CHAT_MODEL: string = 'chat-model-small';  

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': openai('gpt-4o-mini'),  // Using GPT-4o Mini as requested
    'chat-model-large': openai('gpt-4o'),
    'title-model': openai('gpt-4-turbo'),
    'artifact-model': openai('gpt-4o-mini'),  // Also using GPT-4o Mini here
  },
  imageModels: {
    'small-model': openai.image('dall-e-2'),
    'large-model': openai.image('dall-e-3'),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'GPT-4o Mini', // Updated name
    description: 'Fast, lightweight tasks with balanced capabilities',
  },
  {
    id: 'chat-model-large',
    name: 'GPT-4o',
    description: 'Large model for complex, multi-step tasks',
  }
];
