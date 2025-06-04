export const DEFAULT_CHAT_MODEL: string = 'dma-chat';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'dma-chat',
    name: 'DMA-1',
    description: 'Primary model for all-purpose chat',
  },
  {
    id: 'dma-think',
    name: 'DMA-THINK',
    description: 'Uses advanced reasoning',
  },
];
