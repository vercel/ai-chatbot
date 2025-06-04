import type { UserType } from '../auth';
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
    availableChatModelIds: ['dma-chat', 'dma-think'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['dma-chat', 'dma-think'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};

export function isEntitledToFeature(userType: UserType, feature: string): boolean {
  // For now, all features are available to all users
  return true;
}
