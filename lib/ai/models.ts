import { getTranslations } from 'next-intl/server';

export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export async function getChatModels(): Promise<Array<ChatModel>> {
  const t = await getTranslations('Models');

  return [
    {
      id: 'chat-model',
      name: t('chatModelName'),
      description: t('chatModelDescription'),
    },
    {
      id: 'chat-model-reasoning',
      name: t('reasoningModelName'),
      description: t('reasoningModelDescription'),
    },
  ];
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
];
