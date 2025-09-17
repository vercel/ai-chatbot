export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: '4o-mini',
    description: 'Базовая модель для простых задач',
  },
  {
    id: 'chat-model-advanced',
    name: '4o',
    description: 'Продвинутая модель для более сложных задач',
  },
];
