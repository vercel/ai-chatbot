import type { ChatModel } from './models';

export type MembershipTier = 'guest' | 'free';

interface Entitlements {
  maxMessagesPerDay: number;
  chatModelsAvailable: Array<ChatModel['id']>;
}

export const entitlementsByMembershipTier: Record<
  MembershipTier,
  Entitlements
> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    chatModelsAvailable: ['chat-model', 'chat-model-reasoning'],
  },

  /*
   * For user with an account
   */
  free: {
    maxMessagesPerDay: 100,
    chatModelsAvailable: ['chat-model', 'chat-model-reasoning'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
