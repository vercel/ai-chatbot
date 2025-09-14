import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const DEFAULT_CHAT_MODEL: string = 'google/gemini-flash-1.5';

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and versatile multimodal model from Google',
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    description: 'The latest small, fast, and capable model from Meta',
  },
  {
    id: 'mistralai/mistral-large-latest',
    name: 'Mistral Large',
    description: 'Flagship model from Mistral AI with top-tier reasoning',
  },
];

export const getStaticModels = (): ChatModel[] => chatModels;
