import type { UserType } from "@/app/(auth)/auth";
import type { ChatModel } from "./models";
import { getChatModels } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

// Get all available model IDs dynamically
function getAllAvailableModelIds(): string[] {
  const models = getChatModels();
  return models.map((model: ChatModel) => model.id);
}

// Get basic models (excluding experimental ones)
function getBasicModelIds(): string[] {
  const models = getChatModels();
  return models
    .filter((model: ChatModel) => !model.name.toLowerCase().includes('experimental'))
    .map((model: ChatModel) => model.id);
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: getBasicModelIds(),
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: getAllAvailableModelIds(),
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
