export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'llama-3.3-70b-versatile',
    description: 'Groq Llama 3.3 70B Versatile model',
  },
  {
    id: 'DeepSeek-R1-Distill-Llama-70b',
    name: 'DeepSeek-R1-Distill-Llama-70b',
    description: 'Groq DeepSeek R1 Distill Llama 70B model',
  },
  {
    id: 'gemma2-9b-it',
    name: 'gemma2-9b-it',
    description: 'Groq Gemma 2 9B IT model',
  },
  {
    id: 'gemini-2.5-flash-preview',
    name: 'gemini-2.5-flash-preview',
    description: 'Gemini 2.5 Flash Preview model',
  },
  {
    id: 'gemini-2.5-flash-preview-thinking',
    name: 'gemini-2.5-flash-preview-thinking',
    description: 'Gemini 2.5 Flash Preview Thinking model',
  },
];
