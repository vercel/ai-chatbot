export const DEFAULT_CHAT_MODEL: string = 'fast';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'fast',
    name: 'Fast',
    description: 'Quick responses using GPT-4o-mini',
  },
  {
    id: 'smart',
    name: 'Smart',
    description: 'More thoughtful responses using GPT-4o',
  },
];
