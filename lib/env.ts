import 'server-only';

import { z } from 'zod';
import { config } from 'dotenv';

// Only load .env.local in development - Vercel handles env vars directly in production
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  config({ path: '.env.local' });
}

const envSchema = z
  .object({
    AUTH_SECRET: z.string().min(1),
    BLOB_READ_WRITE_TOKEN: z.string().min(1),
    MYSQL_URL: z.string().min(1),
    NEXT_PUBLIC_REGION_NAME: z.string().min(1).max(32),
    OPENAI_API_KEY: z.string().min(1),
    POSTGRES_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    XAI_API_KEY: z.string().min(1),
  })
  .required()
  .readonly();

type Env = z.infer<typeof envSchema>;

// Only validate environment variables on the server side
const validateEnv = (): Env => {
  const result = envSchema.safeParse({
    AUTH_SECRET: process.env.AUTH_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    MYSQL_URL: process.env.MYSQL_URL,
    NEXT_PUBLIC_REGION_NAME: process.env.NEXT_PUBLIC_REGION_NAME,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    POSTGRES_URL: process.env.POSTGRES_URL,
    REDIS_URL: process.env.REDIS_URL,
    XAI_API_KEY: process.env.XAI_API_KEY,
  });

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());

    // Don't exit during tests - throw error instead so tests can handle it
    if (process.env.NODE_ENV === 'test' || process.env.Jest) {
      throw new Error('Environment validation failed during test execution');
    }

    // Only exit on server side
    if (typeof window === 'undefined') {
      process.exit(1);
    } else {
      throw new Error('Environment validation failed on client side');
    }
  }

  return Object.freeze(result.data) as Readonly<Env>;
};

// Get environment variables safely for both client and server
const getEnvSafely = (): Partial<Env> => {
  // On server side, validate all environment variables
  if (typeof window === 'undefined') {
    return validateEnv();
  }

  // On client side, only return public environment variables
  // These should be prefixed with NEXT_PUBLIC_ in Next.js
  return {
    NEXT_PUBLIC_REGION_NAME: process.env.NEXT_PUBLIC_REGION_NAME || 'Dev',
  };
};

const env = getEnvSafely();

// Only wrapped, so that DI patterns could be used in unit tests
export type EnvGetter = () => Env;
export const getEnv: EnvGetter = () => {
  // On server side, return full validated environment
  if (typeof window === 'undefined') {
    return validateEnv();
  }

  // On client side, return partial environment with safe defaults
  return {
    AUTH_SECRET: '',
    BLOB_READ_WRITE_TOKEN: '',
    MYSQL_URL: '',
    NEXT_PUBLIC_REGION_NAME: process.env.NEXT_PUBLIC_REGION_NAME || 'Dev',
    POSTGRES_URL: '',
    REDIS_URL: '',
    XAI_API_KEY: '',
  } as Env;
};
