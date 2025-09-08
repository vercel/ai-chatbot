/**
 * Test Helper Functions
 * Common utilities for testing across the application
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

// Test data factories
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isGuest: false,
  ...overrides,
});

export const createMockGuestUser = (overrides: Partial<any> = {}) => ({
  id: 'guest-user-id',
  email: 'guest-12345-abcd@localhost',
  name: 'Guest User ABC123',
  role: 'guest',
  createdAt: new Date(),
  updatedAt: new Date(),
  isGuest: true,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  ...overrides,
});

export const createMockArtifact = (overrides: Partial<any> = {}) => ({
  id: 'test-artifact-id',
  title: 'Test Artifact',
  content: 'console.log("Hello, World!");',
  type: 'code',
  language: 'javascript',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  userId: 'test-user-id',
  metadata: {
    language: 'javascript',
    tags: ['test'],
  },
  ...overrides,
});

export const createMockChatMessage = (overrides: Partial<any> = {}) => ({
  id: 'msg-' + Date.now(),
  role: 'user',
  content: 'Hello, Claude!',
  timestamp: new Date(),
  sessionId: 'test-session',
  ...overrides,
});

export const createMockChatResponse = (overrides: Partial<any> = {}) => ({
  content: 'Hello! How can I help you?',
  sessionId: 'test-session',
  usage: {
    inputTokens: 10,
    outputTokens: 15,
    totalTokens: 25,
  },
  metadata: {
    provider: 'claude-sdk',
    model: 'claude-3-sonnet',
  },
  ...overrides,
});

// Request/Response helpers
export const createMockRequest = (overrides: RequestInit = {}) => {
  const defaultHeaders = new Headers({
    'content-type': 'application/json',
    'user-agent': 'Jest Test Environment',
    'x-forwarded-for': '127.0.0.1',
    'x-real-ip': '127.0.0.1',
  });

  return new Request('http://localhost:3033/api/test', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ test: 'data' }),
    ...overrides,
  });
};

export const createMockResponse = (data: any = {}, status: number = 200, headers: HeadersInit = {}) => {
  const defaultHeaders = {
    'content-type': 'application/json',
    ...headers,
  };

  return new Response(JSON.stringify(data), {
    status,
    headers: defaultHeaders,
  });
};

export const createMockFormData = (data: Record<string, string | File> = {}) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

// Redis helpers
export const createMockRedisClient = () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  incr: jest.fn().mockResolvedValue(1),
  decr: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  expire: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(1),
  ping: jest.fn().mockResolvedValue('PONG'),
  info: jest.fn().mockResolvedValue('redis_version:7.0.0\nused_memory_human:1M\nuptime_in_seconds:3600'),
  flushdb: jest.fn().mockResolvedValue('OK'),
  keys: jest.fn().mockResolvedValue([]),
  mget: jest.fn().mockResolvedValue([]),
  mset: jest.fn().mockResolvedValue('OK'),
  pipeline: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    setex: jest.fn().mockReturnThis(),
    incr: jest.fn().mockReturnThis(),
    ttl: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([
      [null, 'OK'],
      [null, 1],
    ]),
  }),
  quit: jest.fn().mockResolvedValue('OK'),
  disconnect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  off: jest.fn(),
  config: jest.fn().mockResolvedValue('OK'),
});

// Database helpers
export const createMockDatabase = () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
  execute: jest.fn().mockResolvedValue({ affectedRows: 0 }),
  transaction: jest.fn().mockImplementation(async (callback) => {
    const tx = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      execute: jest.fn().mockResolvedValue({ affectedRows: 0 }),
      rollback: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
    };
    return callback(tx);
  }),
  close: jest.fn().mockResolvedValue(undefined),
});

// Time and date helpers
export const freezeTime = (date: string | Date = '2024-01-01T00:00:00Z') => {
  const frozenDate = new Date(date);
  const originalDateNow = Date.now;
  const originalDate = global.Date;

  global.Date = class extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(frozenDate);
      } else {
        super(...args);
      }
    }

    static now() {
      return frozenDate.getTime();
    }
  } as any;

  Date.now = () => frozenDate.getTime();

  return () => {
    global.Date = originalDate;
    Date.now = originalDateNow;
  };
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForNextTick = () => new Promise(resolve => process.nextTick(resolve));

// Environment helpers
export const withEnvironment = (envVars: Record<string, string>, fn: () => void | Promise<void>) => {
  return async () => {
    const originalEnv = { ...process.env };
    
    // Set test environment variables
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    try {
      await fn();
    } finally {
      // Restore original environment
      process.env = originalEnv;
    }
  };
};

// Error testing helpers
export const expectToThrowAsync = async (fn: () => Promise<any>, expectedError?: string | RegExp) => {
  let thrownError: Error | null = null;

  try {
    await fn();
  } catch (error) {
    thrownError = error as Error;
  }

  expect(thrownError).toBeTruthy();

  if (expectedError) {
    if (typeof expectedError === 'string') {
      expect(thrownError!.message).toContain(expectedError);
    } else {
      expect(thrownError!.message).toMatch(expectedError);
    }
  }

  return thrownError;
};

// Async iteration helpers
export const collectAsyncIterable = async <T>(iterable: AsyncIterable<T>): Promise<T[]> => {
  const results: T[] = [];
  for await (const item of iterable) {
    results.push(item);
  }
  return results;
};

// Network and HTTP helpers
export const mockFetch = (responses: Array<{ status?: number; data?: any; error?: Error }>) => {
  let callIndex = 0;
  
  return jest.fn().mockImplementation(() => {
    const response = responses[callIndex] || responses[responses.length - 1];
    callIndex = Math.min(callIndex + 1, responses.length - 1);

    if (response.error) {
      return Promise.reject(response.error);
    }

    return Promise.resolve(new Response(
      JSON.stringify(response.data || {}),
      { status: response.status || 200 }
    ));
  });
};

// Stream helpers
export const createMockReadableStream = (chunks: string[]) => {
  let index = 0;
  
  return new ReadableStream({
    start(controller) {
      const pump = () => {
        if (index < chunks.length) {
          controller.enqueue(new TextEncoder().encode(chunks[index]));
          index++;
          setTimeout(pump, 10); // Small delay to simulate streaming
        } else {
          controller.close();
        }
      };
      pump();
    },
  });
};

// Performance testing helpers
export const measurePerformance = async (fn: () => Promise<any>, iterations: number = 1) => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  return {
    min: Math.min(...times),
    max: Math.max(...times),
    average: times.reduce((sum, time) => sum + time, 0) / times.length,
    total: times.reduce((sum, time) => sum + time, 0),
    times,
  };
};

// Component testing helpers (for React components)
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  wrapper?: ({ children }: { children: ReactNode }) => ReactElement;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialState, wrapper, ...renderOptions } = options;

  // Here you would typically wrap with providers like Redux, Router, etc.
  // For now, just render normally
  const Wrapper = wrapper || (({ children }: { children: ReactNode }) => <>{children}</>);

  return {
    ...render(ui, {
      wrapper: Wrapper,
      ...renderOptions,
    }),
    // Add additional utilities here
  };
};

// Cookie helpers
export const createMockCookies = (cookies: Record<string, string> = {}) => ({
  get: jest.fn((name: string) => cookies[name]),
  set: jest.fn((name: string, value: string) => {
    cookies[name] = value;
  }),
  delete: jest.fn((name: string) => {
    delete cookies[name];
  }),
  has: jest.fn((name: string) => name in cookies),
  getAll: jest.fn(() => cookies),
});

// Session helpers
export const createMockSession = (overrides: Partial<any> = {}) => ({
  user: createMockUser(),
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  sessionId: 'mock-session-id',
  ...overrides,
});

// Rate limit helpers
export const createMockRateLimitResult = (overrides: Partial<any> = {}) => ({
  success: true,
  limit: 100,
  remaining: 95,
  resetTime: Date.now() + 60000,
  ...overrides,
});

// Validation helpers
export const expectValidUUID = (value: string) => {
  expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
};

export const expectValidEmail = (email: string) => {
  expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

export const expectValidTimestamp = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  expect(date.getTime()).not.toBeNaN();
  expect(date.getTime()).toBeGreaterThan(0);
};

// Cleanup helpers
export const createCleanupStack = () => {
  const cleanupFunctions: Array<() => void | Promise<void>> = [];

  return {
    add: (cleanup: () => void | Promise<void>) => {
      cleanupFunctions.push(cleanup);
    },
    run: async () => {
      for (const cleanup of cleanupFunctions.reverse()) {
        await cleanup();
      }
      cleanupFunctions.length = 0;
    },
  };
};

export default {
  createMockUser,
  createMockGuestUser,
  createMockArtifact,
  createMockChatMessage,
  createMockChatResponse,
  createMockRequest,
  createMockResponse,
  createMockFormData,
  createMockRedisClient,
  createMockDatabase,
  freezeTime,
  sleep,
  waitForNextTick,
  withEnvironment,
  expectToThrowAsync,
  collectAsyncIterable,
  mockFetch,
  createMockReadableStream,
  measurePerformance,
  renderWithProviders,
  createMockCookies,
  createMockSession,
  createMockRateLimitResult,
  expectValidUUID,
  expectValidEmail,
  expectValidTimestamp,
  createCleanupStack,
};