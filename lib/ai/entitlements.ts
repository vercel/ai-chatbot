import type { UserType } from "@/lib/auth";
import type { ChatModel } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: [
      "anthropic/claude-3-5-haiku-latest",
      "google/gemini-2.0-flash-exp",
    ],
  },

  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      "anthropic/claude-sonnet-4",
      "anthropic/claude-3-5-sonnet-latest",
      "anthropic/claude-3-5-haiku-latest",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "google/gemini-2.0-flash-exp",
      "google/gemini-1.5-pro-latest",
    ],
  },
};
