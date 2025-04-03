import configFromProject from '../chat.config';
import { isTestEnvironment } from './constants';

export interface ChatConfig {
  /**
   * Whether guests are allowed to use the application without authentication.
   */
  guestUsage: {
    /**
     * Boolean flag indicating whether guest usage is enabled.
     */
    isEnabled: boolean;

    /**
     * User ID of guest account to assign documents and attachments to.
     */
    userId: string | null;
  };
}

function getGuestUsageFromEnv() {
  if (
    process.env.ALLOW_GUEST_USAGE === 'True' &&
    process.env.GUEST_USER_ID === undefined
  ) {
    throw new Error('GUEST_USER_ID is required when ALLOW_GUEST_USAGE is true');
  }

  return process.env.ALLOW_GUEST_USAGE === 'True' &&
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
  const env = {
    guestUsage: getGuestUsageFromEnv(),
  };

  if (isTestEnvironment) {
    return {
      ...configFromProject,
      guestUsage: env.guestUsage,
    };
  }

  return {
    ...configFromProject,
    guestUsage:
      env.guestUsage.isEnabled && env.guestUsage.userId
        ? env.guestUsage
        : configFromProject.guestUsage,
  };
}

export const chatConfig: ChatConfig = getConfig();
