/**
 * @file lib/constants.ts
 * @description Defines global constants for the application.
 * @version 1.0.1
 * @date 2025-06-11
 * @updated Удалена неиспользуемая константа guestRegex.
 */

/** HISTORY:
 * v1.0.1 (2025-06-11): Удалена константа guestRegex после отключения гостевых сессий.
 * v1.0.0 (2025-06-10): Initial version. Resolved TS2305 by removing import for 'generateDummyPassword' and assigning a static value to DUMMY_PASSWORD.
 */

export const isProductionEnvironment = process.env.NODE_ENV === 'production'
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development'
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
  process.env.PLAYWRIGHT ||
  process.env.CI_PLAYWRIGHT,
)

export const DUMMY_PASSWORD = 'static-dummy-password-for-now'

// END OF: lib/constants.ts
