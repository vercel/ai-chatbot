export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'DMA-1',
    name: 'DMA-1',
    description: 'Primary model for all-purpose chat',
  },
  {
    id: 'DMA-THINK',
    name: 'DMA-THINK',
    description: 'Uses advanced reasoning',
  },
];
