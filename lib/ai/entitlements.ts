import type { ChatModel } from './models';
import type { UserType } from '@/app/(auth)/auth';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['chat-model', 'chat-model-reasoning', 'web-automation-model', 'benefit-applications-agent'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['chat-model', 'chat-model-reasoning', 'web-automation-model', 'benefit-applications-agent'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
