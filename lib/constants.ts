import { generateDummyPassword } from "./db/utils";

export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

// Guest users have emails like: guest-{uuid}@anonymous.local
export const guestRegex = /^guest-.*@anonymous\.local$/;

export const DUMMY_PASSWORD = generateDummyPassword();

// Note: Authentication is always enabled. Guest users provide anonymous access.
