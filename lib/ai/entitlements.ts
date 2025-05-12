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
    availableChatModelIds: ['grok-chat', 'grok-reasoning', 'gemini-quantum', 'gemini-vision-pro', 'gemini-flash'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['grok-chat', 'grok-reasoning', 'gemini-quantum', 'gemini-vision-pro', 'gemini-flash'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
