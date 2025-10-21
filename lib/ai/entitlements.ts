import type { UserType } from "@/app/(auth)/auth";
import type { ChatModel } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: ["npo-yen-model", "cs-ai-model", "cs-minh-model"],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ["npo-yen-model", "cs-ai-model", "cs-minh-model"],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
