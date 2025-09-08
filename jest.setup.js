/**
 * Jest global setup and configuration
 * Sets up testing environment, mocks, and global utilities
 */

// Import testing libraries
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { server } from './__tests__/utils/mocks/server';

// Global test environment setup
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch globally if not available
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(),
  }),
  headers: () => ({
    get: jest.fn((key) => {
      // Common header mocks
      const headerMocks = {
        'user-agent': 'Jest Test Environment',
        'x-forwarded-for': '127.0.0.1',
        'x-real-ip': '127.0.0.1',
      };
      return headerMocks[key.toLowerCase()];
    }),
    has: jest.fn(),
    entries: jest.fn(() => []),
  }),
}));

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => (fn) => {
  const DynamicComponent = (props) => {
    const Component = fn();
    return Component.then ? null : <Component {...props} />;
  };
  DynamicComponent.displayName = 'MockedDynamicComponent';
  return DynamicComponent;
});

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  REDIS_DB: '1', // Use different DB for tests
  AUTH_SECRET: 'test-auth-secret',
  NEXTAUTH_URL: 'http://localhost:3033',
  NEXTAUTH_SECRET: 'test-nextauth-secret',
  ANTHROPIC_API_KEY: 'test-anthropic-key',
};

// Mock console methods in CI
if (process.env.CI) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test utilities
global.testUtils = {
  // Create mock request object
  createMockRequest: (overrides = {}) => {
    const defaultHeaders = new Headers({
      'content-type': 'application/json',
      'user-agent': 'Jest Test Environment',
      'x-forwarded-for': '127.0.0.1',
    });

    return new Request('http://localhost:3033/api/test', {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({}),
      ...overrides,
    });
  },

  // Create mock response object
  createMockResponse: (data = {}, status = 200) => {
    return Response.json(data, { status });
  },

  // Wait for async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    isGuest: false,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }),

  // Create mock guest user
  createMockGuestUser: (overrides = {}) => ({
    id: 'guest-user-id',
    email: 'guest-12345-abcd@localhost',
    name: 'Guest User ABC123',
    isGuest: true,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ...overrides,
  }),

  // Create mock artifact
  createMockArtifact: (overrides = {}) => ({
    id: 'artifact-test-id',
    title: 'Test Artifact',
    content: 'console.log("Hello, World!");',
    type: 'code',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    metadata: {
      language: 'javascript',
      tags: ['test'],
    },
    userId: 'test-user-id',
    ...overrides,
  }),

  // Create mock Redis client
  createMockRedisClient: () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    ping: jest.fn().mockResolvedValue('PONG'),
    info: jest.fn().mockResolvedValue('redis_version:7.0.0\nused_memory_human:1M\nuptime_in_seconds:3600'),
    pipeline: jest.fn().mockReturnValue({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([['OK', '0'], ['OK', -1]]),
    }),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
    config: jest.fn().mockResolvedValue('OK'),
  }),
};

// Mock window.location for client-side tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3033',
    origin: 'http://localhost:3033',
    protocol: 'http:',
    host: 'localhost:3033',
    hostname: 'localhost',
    port: '3033',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Setup MSW (Mock Service Worker) for API mocking
beforeAll(() => {
  // Start the server
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

afterEach(() => {
  // Clean up DOM after each test
  cleanup();
  
  // Reset MSW handlers
  server.resetHandlers();
  
  // Clear all mocks
  jest.clearAllMocks();
});

afterAll(() => {
  // Close the server
  server.close();
});

// Custom matchers
expect.extend({
  // Check if error has specific message
  toHaveErrorMessage(received, expectedMessage) {
    const pass = received instanceof Error && received.message.includes(expectedMessage);
    return {
      pass,
      message: () =>
        pass
          ? `expected error not to have message containing "${expectedMessage}"`
          : `expected error to have message containing "${expectedMessage}", got "${received?.message || received}"`,
    };
  },

  // Check if function is async
  toBeAsync(received) {
    const pass = typeof received === 'function' && received.constructor.name === 'AsyncFunction';
    return {
      pass,
      message: () =>
        pass
          ? `expected function not to be async`
          : `expected function to be async`,
    };
  },

  // Check if date is recent (within last minute)
  toBeRecentDate(received, withinMs = 60000) {
    const now = Date.now();
    const receivedTime = new Date(received).getTime();
    const pass = Math.abs(now - receivedTime) <= withinMs;
    
    return {
      pass,
      message: () =>
        pass
          ? `expected date ${received} not to be within ${withinMs}ms of now`
          : `expected date ${received} to be within ${withinMs}ms of now`,
    };
  },
});

// Enhanced error handling for tests
const originalError = console.error;
console.error = (...args) => {
  // Don't log expected test errors
  if (args[0]?.includes?.('Warning:') || args[0]?.includes?.('Error:')) {
    return;
  }
  originalError.call(console, ...args);
};

// Detect unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection in test:', reason);
});

// Set longer timeout for integration tests
jest.setTimeout(15000);

console.log('Jest setup completed successfully');