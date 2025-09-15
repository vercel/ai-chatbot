import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const DEFAULT_CHAT_MODEL: string = 'google/gemini-flash-1.5';

// Debug logging for OpenRouter configuration
console.log('OpenRouter: API key present:', !!process.env.OPENROUTER_API_KEY);
console.log('OpenRouter: Base URL env:', process.env.OPENROUTER_BASE_URL);
console.log('OpenRouter: App URL env:', process.env.NEXT_PUBLIC_APP_URL);

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'IntelliSync Chatbot',
  },
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
