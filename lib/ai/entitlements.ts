import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

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
      'openai-gpt4o', 
      'openai-o3mini', 
      'openai-reasoning',
      'xai-grok2', 
      'xai-grok2-vision', 
      'xai-grok3-mini'
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
