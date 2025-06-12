/**
 * @file lib/ai/tools/constants.ts
 * @description Defines standardized names for AI tools to ensure consistency across the application.
 * @version 1.1.0
 * @date 2025-06-12
 * @updated Added SITE_GENERATE tool name.
 */

/** HISTORY:
 * v1.1.0 (2025-06-12): Added SITE_GENERATE tool name.
 * v1.0.0 (2025-06-10): Initial version with all artifact-related tool names.
 */

export const AI_TOOL_NAMES = {
  ARTIFACT_CREATE: 'artifactCreate',
  ARTIFACT_UPDATE: 'artifactUpdate',
  ARTIFACT_ENHANCE: 'artifactEnhance',
  ARTIFACT_CONTENT: 'artifactContent',
  ARTIFACT_DELETE: 'artifactDelete',
  ARTIFACT_RESTORE: 'artifactRestore',
  SITE_GENERATE: 'siteGenerate',
  GET_WEATHER: 'getWeather',
} as const

export type AiToolName = (typeof AI_TOOL_NAMES)[keyof typeof AI_TOOL_NAMES];

// END OF: lib/ai/tools/constants.ts
