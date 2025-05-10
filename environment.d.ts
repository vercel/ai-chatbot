/// <reference types="node" />

// TypeScript declaration for process.env
declare namespace NodeJS {
  interface ProcessEnv {
    // Core environment variables
    NODE_ENV: 'development' | 'production' | 'test';

    // Database
    POSTGRES_URL?: string;

    // Redis and Upstash
    REDIS_URL?: string;
    UPSTASH_REDIS_REST_URL?: string;

    // AI Provider API keys
    OPENAI_API_KEY?: string;
    OPENAI_BASE_URL?: string;

    XAI_API_KEY?: string;
    XAI_BASE_URL?: string;

    GOOGLE_GENERATIVE_AI_API_KEY?: string;
    GOOGLE_API_KEY?: string;

    ANTHROPIC_API_KEY?: string;

    // Brave search
    BRAVE_SEARCH_API_KEY?: string;

    // Auth
    NEXTAUTH_URL?: string;
    NEXTAUTH_SECRET?: string;

    // Other project-specific environment variables
    [key: string]: string | undefined;
  }
}
