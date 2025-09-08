export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'GPT-5',
    description: 'Unified chat + reasoning (OpenAI gpt-5)',
  },
];

// Resolve UI model IDs to provider model IDs used by tokenlens/context windows
// and server-side provider configuration. Keep this in a client-safe module.
export function resolveProviderModelId(id: string): string {
  switch (id) {
    case 'chat-model':
      return 'openai/gpt-5';
    case 'title-model':
      return 'openai/gpt-4.1-nano';
    case 'artifact-model':
      return 'openai/gpt-4.1';
    default:
      return id; // pass-through if already a provider id
  }
}
