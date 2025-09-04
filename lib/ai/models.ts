export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'gpt-5',
    description: 'Unified chat + reasoning (OpenAI gpt-5)',
  },
  {
    id: 'gemini-multimodal',
    name: 'Gemini 2.5 Flash',
    description: 'Multimodal model with image understanding (Google)',
  },
];
