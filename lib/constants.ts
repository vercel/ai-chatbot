import { generateDummyPassword } from './db/utils';
import { env } from '@/env';

export const isProductionEnvironment = env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  env.PLAYWRIGHT_TEST_BASE_URL ||
    env.PLAYWRIGHT ||
    env.CI_PLAYWRIGHT,
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();
