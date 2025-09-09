import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';
import { vercel } from '@t3-oss/env-core/presets-zod';

export const env = createEnv({
  extends: [vercel()],
  server: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .prefault('development'),
    // Bundle analyzer
    ANALYZE: z.enum(['true', 'false']).optional(),
    // AI SDK - OpenAI
    AI_GATEWAY_API_KEY: z.string().startsWith('vck_'),
    // Auth
    AUTH_SECRET: z.string(),
    // Database
    POSTGRES_URL: z.url(),
    BLOB_READ_WRITE_TOKEN: z.string().startsWith('vercel_blob_'),
    // Redis
    REDIS_URL: z.url(),
    // Playwright
    PLAYWRIGHT_TEST_BASE_URL: z.string().optional(),
    PLAYWRIGHT: z.string().optional(),
    CI_PLAYWRIGHT: z.string().optional(),
    CI: z.string().optional(),
    // Server
    PORT: z.string().optional(),
  },
  client: {},
  experimental__runtimeEnv: {},
});