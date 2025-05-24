import { allModels, type ChatModel } from './provider-configs';

export const DEFAULT_CHAT_MODEL: string = 'xai-grok-2-1212';

export type { ChatModel };

// Export all models from provider configs
export const chatModels: Array<ChatModel> = allModels;

// Legacy models for backward compatibility
export const legacyModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Chat model',
    description: 'Primary model for all-purpose chat',
    providerId: 'xai',
    capabilities: ['reasoning', 'code'],
    contextWindow: 128000,
    pricing: 'paid',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
    providerId: 'xai',
    capabilities: ['reasoning'],
    contextWindow: 32000,
    pricing: 'paid',
  },
];

// Combine all models (legacy + new)
export const allChatModels: Array<ChatModel> = [...legacyModels, ...allModels];
