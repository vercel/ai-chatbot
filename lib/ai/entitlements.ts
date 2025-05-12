import type { UserType } from '@/app/(auth)/auth';
import type { ModelConfig } from '../types';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<string>; // Using string type directly for model IDs
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: ['chat-model', 'chat-model-reasoning'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['chat-model', 'chat-model-reasoning'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
