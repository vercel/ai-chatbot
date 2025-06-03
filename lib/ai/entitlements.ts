import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';
import { allChatModels } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

// Get all model IDs for easy access
const allModelIds = allChatModels.map((model) => model.id);

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: allModelIds,
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: allModelIds,
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
