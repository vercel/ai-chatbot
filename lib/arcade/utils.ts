export const ARCADE_AUTHORIZATION = {
  REQUIRED: 'ARCADE_AUTHORIZATION_REQUIRED',
  TOOL_NAME: 'arcade-authorization',
  PENDING: 'ARCADE_AUTHORIZATION_PENDING',
  AUTHORIZED: 'ARCADE_AUTHORIZED',
  FAILED: 'ARCADE_AUTHORIZATION_FAILED',
  CANCELLED: 'ARCADE_AUTHORIZATION_CANCELLED',
} as const;

export const formatOpenAIToolNameToArcadeToolName = (toolName: string) => {
  return toolName.replaceAll('_', '.');
};

export const getToolkitNameByOpenAIToolName = (toolName: string) => {
  // The toolkit name is the first part of the tool name
  return toolName.split('_').shift()?.toLowerCase();
};
