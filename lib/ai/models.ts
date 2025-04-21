export const DEFAULT_CHAT_MODEL: string = 'n8n-assistant';

interface ChatModel {
  id: string;
  name: string;
  description: string;
  isN8n?: boolean;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'GPT 4.1',
    description: 'Primary model for all-purpose chat',
  },
  {
    id: 'chat-model-reasoning',
    name: 'o3',
    description: 'Uses advanced reasoning',
  },
  {
    id: 'n8n-assistant',
    name: 'Y-1',
    description:
      'Proprietary model with advanced tool-calling and user context',
    isN8n: true,
  },
];
