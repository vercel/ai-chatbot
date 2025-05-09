import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './client-models';
import { PROVIDERS } from './client-models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: ['openai-gpt4o', 'xai-grok2'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      // OpenAI Models
      'openai-gpt4o',
      'openai-gpt-4o',
      'openai-o1',
      'openai-o1-mini',
      'openai-o1-preview',
      'openai-o1-pro',
      'openai-o3mini',
      'openai-reasoning',
      // xAI models
      'xai-grok2',
      'xai-grok2-vision',
      'xai-grok3-mini',
      // Add generic patterns for each provider to allow all models from that provider
      `${PROVIDERS.OPENAI}-`,
      `${PROVIDERS.XAI}-`,
      `${PROVIDERS.ANTHROPIC}-`,
      `${PROVIDERS.GOOGLE}-`,
      `${PROVIDERS.MISTRAL}-`,
      `${PROVIDERS.GROQ}-`,
      `${PROVIDERS.COHERE}-`,
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
