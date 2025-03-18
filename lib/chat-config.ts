import configFromProject from '../chat.config';

export interface ChatConfig {
  /**
   * Whether guests are allowed to use the application without authentication.
   * Defaults to true.
   *
   * Note: You should also set the environment variable GUEST_USER_ID to a valid user ID to enable guest usage.
   */
  allowGuestUsage: boolean;
}

function getConfig() {
  if (process.env.PLAYWRIGHT) {
    return {
      ...configFromProject,
      allowGuestUsage: process.env.ALLOW_GUEST_USAGE === 'True',
    };
  }

  return {
    ...configFromProject,
    allowGuestUsage: process.env.GUEST_USER_ID
      ? configFromProject.allowGuestUsage
      : false,
  };
}

export const chatConfig: ChatConfig = getConfig();
