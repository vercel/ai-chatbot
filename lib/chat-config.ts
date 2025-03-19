import configFromProject from "../chat.config";
import { isTestEnvironment } from "./constants";

export interface ChatConfig {
  /**
   * Whether guests are allowed to use the application without authentication.
   */
  guestUsage: {
    isEnabled: boolean;
    userId: string | null;
  };
}

function getGuestUsageFromEnv() {
  if (
    process.env.ALLOW_GUEST_USAGE === "True" &&
    process.env.GUEST_USER_ID === undefined
  ) {
    throw new Error("GUEST_USER_ID is required when ALLOW_GUEST_USAGE is true");
  }

  return process.env.ALLOW_GUEST_USAGE === "True" &&
    process.env.GUEST_USER_ID !== undefined
    ? {
        isEnabled: true,
        userId: process.env.GUEST_USER_ID,
      }
    : {
        isEnabled: false,
        userId: null,
      };
}

function getConfig(): ChatConfig {
  if (isTestEnvironment) {
    return {
      ...configFromProject,
      guestUsage: getGuestUsageFromEnv(),
    };
  }

  return {
    ...configFromProject,
    guestUsage: configFromProject.guestUsage?.userId
      ? configFromProject.guestUsage
      : getGuestUsageFromEnv(),
  };
}

export const chatConfig: ChatConfig = getConfig();
