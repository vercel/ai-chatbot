import type { UserType } from "@/app/(auth)/auth";
import type { ChatModel } from "./models";
import { getChatModels, refreshModels } from "./models";
import { refreshModelCache } from "./model-fetcher";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

// Get all available model IDs dynamically
function getAllAvailableModelIds(): string[] {
  // Refresh caches so new models (e.g., Imagen) appear without server restart
  try { refreshModelCache(); } catch {}
  const models = refreshModels();
  return models.map((model: ChatModel) => model.id);
}

// Get basic models (excluding experimental ones)
function getBasicModelIds(): string[] {
  // Refresh caches so list isn’t stale in the client bundle
  try { refreshModelCache(); } catch {}
  const models = refreshModels();
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
