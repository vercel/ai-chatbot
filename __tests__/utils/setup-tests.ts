/**
 * Additional Test Setup
 * Extended setup utilities for specific test scenarios
 */

import { server } from './mocks/server';
import nextMocks from './mocks/next-mocks';
import testHelpers from './helpers/test-helpers';

// Global test setup utilities
export const setupTestEnvironment = () => {
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'warn',
  });

  // Setup global console overrides for cleaner test output
  if (process.env.CI || process.env.SILENT_TESTS) {
    global.console = {
      ...console,
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };
  }

  // Setup global error handling
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Suppress expected React warnings and errors in tests
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning:') ||
        message.includes('ReactDOM.render is no longer supported') ||
        message.includes('validateDOMNesting'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  // Setup cleanup after each test
  afterEach(() => {
    // Reset MSW handlers
    server.resetHandlers();
    
    // Clear all timers
    jest.clearAllTimers();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset module registry to clear any cached modules
    jest.resetModules();
  });

  // Cleanup when all tests are done
  afterAll(() => {
    server.close();
  });
};

// Database test setup
export const setupDatabaseTests = () => {
  const mockDb = testHelpers.createMockDatabase();
  
  beforeEach(() => {
    // Reset database mock
    mockDb.query.mockClear();
    mockDb.execute.mockClear();
  });

  return mockDb;
};

// Redis test setup
export const setupRedisTests = () => {
  const mockRedis = testHelpers.createMockRedisClient();
  
  beforeEach(() => {
    // Reset Redis mock
    Object.values(mockRedis).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockClear();
      }
    });
  });

  return mockRedis;
};

// Authentication test setup
export const setupAuthTests = () => {
  const mockUser = testHelpers.createMockUser();
  const mockGuestUser = testHelpers.createMockGuestUser();
  const mockSession = testHelpers.createMockSession({ user: mockUser });
  
  return {
    mockUser,
    mockGuestUser,
    mockSession,
    // Helper to mock authenticated state
    mockAuthenticated: (user = mockUser) => {
      const mockCookies = testHelpers.createMockCookies({
        'next-auth.session-token': 'mock-session-token',
      });
      
      jest.doMock('next-auth', () => ({
        getServerSession: jest.fn().mockResolvedValue({
          user,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      }));
      
      return { user, mockCookies };
    },
    // Helper to mock guest state
    mockGuest: () => {
      const mockCookies = testHelpers.createMockCookies({
        'guest-token': 'mock-guest-token',
      });
      
      return { user: mockGuestUser, mockCookies };
    },
  };
};

// API test setup
export const setupApiTests = () => {
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  return {
    mockFetch: global.fetch as jest.MockedFunction<typeof fetch>,
    mockSuccessResponse: (data: any) => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    },
    mockErrorResponse: (status: number, message: string) => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        new Response(message, { status })
      );
    },
    mockNetworkError: () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Network error')
      );
    },
  };
};

// Rate limiting test setup
export const setupRateLimitTests = () => {
  const rateLimitData = new Map<string, { count: number; resetTime: number }>();
  
  const mockRateLimit = {
    check: jest.fn((key: string, windowMs: number, maxRequests: number) => {
      const now = Date.now();
      const entry = rateLimitData.get(key);
      
      if (!entry || entry.resetTime < now) {
        rateLimitData.set(key, { count: 1, resetTime: now + windowMs });
        return {
          success: true,
          limit: maxRequests,
          remaining: maxRequests - 1,
          resetTime: now + windowMs,
        };
      }
      
      entry.count++;
      const success = entry.count <= maxRequests;
      
      return {
        success,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - entry.count),
        resetTime: entry.resetTime,
        retryAfter: success ? undefined : Math.ceil((entry.resetTime - now) / 1000),
      };
    }),
    reset: jest.fn(() => {
      rateLimitData.clear();
    }),
  };
  
  beforeEach(() => {
    mockRateLimit.check.mockClear();
    mockRateLimit.reset.mockClear();
    rateLimitData.clear();
  });
  
  return mockRateLimit;
};

// File upload test setup
export const setupFileUploadTests = () => {
  const createMockFile = (name: string, content: string, type: string = 'text/plain') => {
    const file = new File([content], name, { type });
    return file;
  };
  
  const createMockFileList = (files: File[]) => {
    const fileList = {
      length: files.length,
      item: (index: number) => files[index] || null,
      [Symbol.iterator]: function* () {
        for (const file of files) {
          yield file;
        }
      },
    };
    
    // Add files as indexed properties
    files.forEach((file, index) => {
      (fileList as any)[index] = file;
    });
    
    return fileList as FileList;
  };
  
  return {
    createMockFile,
    createMockFileList,
  };
};

// Streaming test setup
export const setupStreamingTests = () => {
  const createMockStream = (chunks: string[], delay: number = 10) => {
    let index = 0;
    
    return new ReadableStream({
      start(controller) {
        const pump = () => {
          if (index < chunks.length) {
            controller.enqueue(new TextEncoder().encode(chunks[index]));
            index++;
            setTimeout(pump, delay);
          } else {
            controller.close();
          }
        };
        pump();
      },
    });
  };
  
  const createMockServerSentEvents = (events: Array<{ event?: string; data: any; id?: string }>) => {
    const chunks = events.map(({ event, data, id }) => {
      let chunk = '';
      if (id) chunk += `id: ${id}\n`;
      if (event) chunk += `event: ${event}\n`;
      chunk += `data: ${JSON.stringify(data)}\n\n`;
      return chunk;
    });
    
    return createMockStream(chunks);
  };
  
  return {
    createMockStream,
    createMockServerSentEvents,
  };
};

// Performance test setup
export const setupPerformanceTests = () => {
  const performanceMeasures: Array<{ name: string; duration: number }> = [];
  
  const measurePerformance = async (name: string, fn: () => Promise<any> | any) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;
    
    performanceMeasures.push({ name, duration });
    return { result, duration };
  };
  
  const getPerformanceMeasures = () => [...performanceMeasures];
  const clearPerformanceMeasures = () => performanceMeasures.length = 0;
  
  beforeEach(() => {
    clearPerformanceMeasures();
  });
  
  return {
    measurePerformance,
    getPerformanceMeasures,
    clearPerformanceMeasures,
  };
};

// Concurrency test setup
export const setupConcurrencyTests = () => {
  const runConcurrently = async <T>(
    tasks: Array<() => Promise<T>>,
    concurrency: number = 5
  ): Promise<T[]> => {
    const results: T[] = [];
    const executing: Promise<void>[] = [];
    
    for (const task of tasks) {
      const promise = task().then(result => {
        results.push(result);
      });
      executing.push(promise);
      
      if (executing.length >= concurrency) {
        await Promise.race(executing);
        const completed = executing.findIndex(p => 
          p === promise || (p as any).isFulfilled
        );
        if (completed > -1) {
          executing.splice(completed, 1);
        }
      }
    }
    
    await Promise.all(executing);
    return results;
  };
  
  return {
    runConcurrently,
  };
};

// Memory test setup
export const setupMemoryTests = () => {
  const getMemoryUsage = () => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 };
  };
  
  const checkMemoryLeak = (before: any, after: any, maxIncrease: number = 10 * 1024 * 1024) => {
    const increase = after.heapUsed - before.heapUsed;
    return {
      leaked: increase > maxIncrease,
      increase,
      maxIncrease,
    };
  };
  
  return {
    getMemoryUsage,
    checkMemoryLeak,
  };
};

// Export all setup functions
export default {
  setupTestEnvironment,
  setupDatabaseTests,
  setupRedisTests,
  setupAuthTests,
  setupApiTests,
  setupRateLimitTests,
  setupFileUploadTests,
  setupStreamingTests,
  setupPerformanceTests,
  setupConcurrencyTests,
  setupMemoryTests,
};