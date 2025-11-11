import { generateDummyPassword } from "./db/utils";

export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isStagingEnvironment =
  process.env.VERCEL_ENV === "preview" ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === "staging";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

export type EnvironmentType = "development" | "staging" | "production";

export function getEnvironmentType(): EnvironmentType {
  if (isDevelopmentEnvironment) {
    return "development";
  }
  if (isStagingEnvironment) {
    return "staging";
  }
  return "production";
}

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();
