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
    name: 'Chat model',
    description: 'Primary model for all-purpose chat',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },
  {
    id: 'n8n-assistant',
    name: 'n8n Assistant',
    description: 'n8n AI',
    isN8n: true,
  },
];
