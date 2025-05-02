export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
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
    id: 'gemini-2.0-flash',
    name: 'Google Gemini Flash',
    description: 'Google Gemini 1.5 Flash - fast, efficient AI model',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    description: 'DeepSeek Chat - versatile conversation model',
  },
  {
    id: 'deepseek-chat-reasoning',
    name: 'DeepSeek Chat Reasoning',
    description: 'DeepSeek Chat with advanced reasoning capabilities',
  },
  {
    id: '4qz21b8oytHrxe6M13BfRgSXLo9mC5BkNMKX8UQBLQvb',
    name: 'Advanced Model',
    description: 'High performance AI model with extended capabilities',
  },
];
