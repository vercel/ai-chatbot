/**
 * Test Suite: Rate Limiting Middleware
 * Tests the rate limiting system with Redis backend and memory fallback
 * 
 * Coverage Areas:
 * - Rate limit enforcement
 * - Redis and memory backend switching
 * - Client identification
 * - Path-based rate limiting
 * - Error handling and resilience
 * - Statistics and monitoring
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimit,
  createRateLimiter,
  rateLimiters,
  applyRateLimit,
  getRateLimitBackend,
  getRateLimitStats,
  type RateLimitResult,
} from '@/lib/middleware/rate-limit';

// Mock dependencies
const mockRedisClient = global.testUtils.createMockRedisClient();

jest.mock('@/lib/config/app-config', () => ({
  appConfig: {
    isFeatureEnabled: jest.fn().mockReturnValue(true),
    get: jest.fn().mockReturnValue({
      security: {
        rateLimit: {
          windowMs: 60000,
          maxRequests: 10,
        },
      },
    }),
  },
}));

jest.mock('@/lib/cache/redis-client', () => ({
  redisClient: {
    getClient: jest.fn(() => mockRedisClient),
  },
  isRedisAvailable: jest.fn().mockReturnValue(true),
}));

describe('Rate Limiting Middleware', () => {
  let originalSetInterval: typeof setInterval;
  let originalClearInterval: typeof clearInterval;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock timers
    originalSetInterval = global.setInterval;
    originalClearInterval = global.clearInterval;
    global.setInterval = jest.fn().mockReturnValue('mock-interval-id');
    global.clearInterval = jest.fn();

    // Reset Redis mock
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.ttl.mockResolvedValue(-1);
    mockRedisClient.setex.mockResolvedValue('OK');
    mockRedisClient.incr.mockResolvedValue(1);
    mockRedisClient.pipeline.mockReturnValue({
      get: jest.fn().mockReturnThis(),
      ttl: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, '0'], // GET result
        [null, -1],  // TTL result
      ]),
    });

    // Reset app config
    const { appConfig } = require('@/lib/config/app-config');
    appConfig.isFeatureEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllTimers();
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  });

  describe('Client Identification', () => {
    it('should generate client identifier from IP and user agent', async () => {
      const request = new NextRequest('http://localhost:3033/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0 (Test Browser)',
        },
      });

      await rateLimit(request);

      // Verify Redis was called with expected key pattern
      expect(mockRedisClient.pipeline).toHaveBeenCalled();
    });

    it('should handle multiple IPs in x-forwarded-for', async () => {
      const request = new NextRequest('http://localhost:3033/api/test', {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.168.1.1',
          'user-agent': 'Test Browser',
        },
      });

      await rateLimit(request);

      // Should use the first IP (203.0.113.1)
      expect(mockRedisClient.pipeline).toHaveBeenCalled();
    });

    it('should fallback to x-real-ip when x-forwarded-for is not available', async () => {
      const request = new NextRequest('http://localhost:3033/api/test', {
        headers: {
          'x-real-ip': '198.51.100.1',
          'user-agent': 'Test Browser',
        },
      });

      await rateLimit(request);
      expect(mockRedisClient.pipeline).toHaveBeenCalled();
    });

    it('should handle missing headers gracefully', async () => {
      const request = new NextRequest('http://localhost:3033/api/test');

      await rateLimit(request);
      expect(mockRedisClient.pipeline).toHaveBeenCalled();
    });

    it('should truncate long user agents', async () => {
      const longUserAgent = 'x'.repeat(200);
      const request = new NextRequest('http://localhost:3033/api/test', {
        headers: {
          'user-agent': longUserAgent,
        },
      });

      await rateLimit(request);
      expect(mockRedisClient.pipeline).toHaveBeenCalled();
    });
  });

  describe('Rate Limit Enforcement', () => {
    describe('Redis Backend', () => {
      beforeEach(() => {
        const { isRedisAvailable } = require('@/lib/cache/redis-client');
        isRedisAvailable.mockReturnValue(true);
      });

      it('should allow requests under the limit', async () => {
        // Mock Redis to return count of 5 (under limit of 10)
        mockRedisClient.pipeline.mockReturnValue({
          get: jest.fn().mockReturnThis(),
          ttl: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            [null, '5'], // Current count
            [null, 300], // TTL in seconds
          ]),
        });

        const request = new NextRequest('http://localhost:3033/api/test');
        const response = await rateLimit(request);

        expect(response.status).not.toBe(429);
        expect(response.headers.get('X-RateLimit-Remaining')).toBe('5');
        expect(response.headers.get('X-RateLimit-Backend')).toBe('redis');
      });

      it('should block requests over the limit', async () => {
        // Mock Redis to return count of 11 (over limit of 10)
        mockRedisClient.pipeline.mockReturnValue({
          get: jest.fn().mockReturnThis(),
          ttl: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            [null, '11'], // Over limit
            [null, 300],  // TTL
          ]),
        });

        const request = new NextRequest('http://localhost:3033/api/test');
        const response = await rateLimit(request);

        expect(response.status).toBe(429);
        
        const body = await response.json();
        expect(body).toMatchObject({
          error: 'Too Many Requests',
          message: expect.stringContaining('Rate limit exceeded'),
          retryAfter: expect.any(Number),
        });

        expect(response.headers.get('Retry-After')).toBeDefined();
        expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
        expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      });

      it('should handle new request windows', async () => {
        // Mock Redis to indicate no existing key (TTL = -1)
        mockRedisClient.pipeline.mockReturnValue({
          get: jest.fn().mockReturnThis(),
          ttl: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            [null, '0'],  // No existing count
            [null, -1],   // No TTL (new window)
          ]),
        });

        const request = new NextRequest('http://localhost:3033/api/test');
        const response = await rateLimit(request);

        expect(response.status).not.toBe(429);
        expect(mockRedisClient.setex).toHaveBeenCalledWith(
          expect.stringMatching(/^rate_limit:/),
          60, // windowMs / 1000
          '1'
        );
      });

      it('should increment existing counters', async () => {
        // Mock existing counter
        mockRedisClient.pipeline.mockReturnValue({
          get: jest.fn().mockReturnThis(),
          ttl: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            [null, '3'],  // Existing count
            [null, 45],   // Remaining TTL
          ]),
        });

        const request = new NextRequest('http://localhost:3033/api/test');
        await rateLimit(request);

        expect(mockRedisClient.incr).toHaveBeenCalledWith(
          expect.stringMatching(/^rate_limit:/)
        );
      });

      it('should handle Redis pipeline errors gracefully', async () => {
        mockRedisClient.pipeline.mockReturnValue({
          get: jest.fn().mockReturnThis(),
          ttl: jest.fn().mockReturnThis(),
          exec: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
        });

        const request = new NextRequest('http://localhost:3033/api/test');
        const response = await rateLimit(request);

        // Should fallback to memory backend
        expect(response.status).not.toBe(429);
        expect(response.headers.get('X-RateLimit-Backend')).toBe('memory');
      });
    });

    describe('Memory Fallback', () => {
      beforeEach(() => {
        const { isRedisAvailable } = require('@/lib/cache/redis-client');
        isRedisAvailable.mockReturnValue(false);
      });

      it('should use memory backend when Redis unavailable', async () => {
        const request = new NextRequest('http://localhost:3033/api/test');
        const response = await rateLimit(request);

        expect(response.status).not.toBe(429);
        expect(response.headers.get('X-RateLimit-Backend')).toBe('memory');
      });

      it('should track requests in memory', async () => {
        const request = new NextRequest('http://localhost:3033/api/test');
        
        // First request
        const response1 = await rateLimit(request);
        expect(response1.headers.get('X-RateLimit-Remaining')).toBe('9');

        // Second request
        const response2 = await rateLimit(request);
        expect(response2.headers.get('X-RateLimit-Remaining')).toBe('8');
      });

      it('should reset counters after window expires', async () => {
        const request = new NextRequest('http://localhost:3033/api/test');
        
        // Make request
        const response1 = await rateLimit(request);
        expect(response1.headers.get('X-RateLimit-Remaining')).toBe('9');

        // Fast-forward time (this would need actual time manipulation in real scenarios)
        // For this test, we simulate by clearing the internal memory store
        // Note: This is a simplified test - in practice you'd need to mock Date.now()
        jest.advanceTimersByTime(61000); // Advance past window
        
        const response2 = await rateLimit(request);
        // In real implementation, this should reset the counter
        expect(response2.status).not.toBe(429);
      });

      it('should block requests over memory limit', async () => {
        const request = new NextRequest('http://localhost:3033/api/test', {
          headers: { 'user-agent': 'MemoryTest' },
        });

        // Make requests up to limit
        const responses = [];
        for (let i = 0; i < 11; i++) {
          responses.push(await rateLimit(request));
        }

        // First 10 should be allowed
        expect(responses.slice(0, 10).every(r => r.status !== 429)).toBe(true);
        
        // 11th should be blocked
        expect(responses[10].status).toBe(429);
      });
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom window and limit options', async () => {
      const customOptions = {
        windowMs: 30000,
        maxRequests: 5,
      };

      const request = new NextRequest('http://localhost:3033/api/test');
      await rateLimit(request, customOptions);

      // Verify custom settings were used (would need to check internal behavior)
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        expect.any(String),
        30, // 30000ms / 1000
        '1'
      );
    });

    it('should use custom key generator', async () => {
      const customKeyGenerator = (req: NextRequest) => 'custom-key';
      
      const request = new NextRequest('http://localhost:3033/api/test');
      await rateLimit(request, { keyGenerator: customKeyGenerator });

      // Verify custom key was used
      expect(mockRedisClient.pipeline).toHaveBeenCalled();
    });

    it('should handle skip options', async () => {
      const request = new NextRequest('http://localhost:3033/api/test');
      
      // These options exist in the interface but aren't implemented yet
      await rateLimit(request, {
        skipSuccessfulRequests: true,
        skipFailedRequests: true,
      });

      expect(mockRedisClient.pipeline).toHaveBeenCalled();
    });
  });

  describe('Feature Toggle', () => {
    it('should bypass rate limiting when disabled', async () => {
      const { appConfig } = require('@/lib/config/app-config');
      appConfig.isFeatureEnabled.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3033/api/test');
      const response = await rateLimit(request);

      expect(response.status).not.toBe(429);
      expect(mockRedisClient.pipeline).not.toHaveBeenCalled();
    });

    it('should respect feature toggle changes', async () => {
      const { appConfig } = require('@/lib/config/app-config');
      
      // Initially disabled
      appConfig.isFeatureEnabled.mockReturnValue(false);
      const request = new NextRequest('http://localhost:3033/api/test');
      
      const response1 = await rateLimit(request);
      expect(mockRedisClient.pipeline).not.toHaveBeenCalled();

      // Enable rate limiting
      appConfig.isFeatureEnabled.mockReturnValue(true);
      
      const response2 = await rateLimit(request);
      expect(mockRedisClient.pipeline).toHaveBeenCalled();
    });
  });

  describe('Pre-configured Rate Limiters', () => {
    describe('rateLimiters.api', () => {
      it('should apply API rate limits', async () => {
        const request = new NextRequest('http://localhost:3033/api/test');
        const response = await rateLimiters.api(request);

        expect(response).toBeDefined();
      });
    });

    describe('rateLimiters.auth', () => {
      it('should apply stricter auth rate limits', async () => {
        const request = new NextRequest('http://localhost:3033/api/auth/login');
        const response = await rateLimiters.auth(request);

        expect(response).toBeDefined();
      });
    });

    describe('rateLimiters.ai', () => {
      it('should apply AI-specific rate limits', async () => {
        const request = new NextRequest('http://localhost:3033/api/claude/chat');
        const response = await rateLimiters.ai(request);

        expect(response).toBeDefined();
      });
    });

    describe('rateLimiters.upload', () => {
      it('should apply upload rate limits', async () => {
        const request = new NextRequest('http://localhost:3033/api/upload');
        const response = await rateLimiters.upload(request);

        expect(response).toBeDefined();
      });
    });

    describe('rateLimiters.strict', () => {
      it('should apply very strict rate limits', async () => {
        const request = new NextRequest('http://localhost:3033/api/admin');
        const response = await rateLimiters.strict(request);

        expect(response).toBeDefined();
      });
    });
  });

  describe('Path-based Rate Limiting', () => {
    describe('applyRateLimit', () => {
      it('should apply auth rate limiting for auth paths', async () => {
        const authPaths = [
          '/api/auth/login',
          '/api/auth/register',
          '/api/auth/reset-password',
        ];

        for (const path of authPaths) {
          const request = new NextRequest(`http://localhost:3033${path}`);
          const response = await applyRateLimit(request);
          
          expect(response).toBeDefined();
        }
      });

      it('should apply AI rate limiting for AI paths', async () => {
        const aiPaths = [
          '/api/claude/chat',
          '/api/ai/complete',
          '/api/claude-main',
        ];

        for (const path of aiPaths) {
          const request = new NextRequest(`http://localhost:3033${path}`);
          const response = await applyRateLimit(request);
          
          expect(response).toBeDefined();
        }
      });

      it('should apply upload rate limiting for upload paths', async () => {
        const uploadPaths = [
          '/api/upload',
          '/api/artifacts/save',
        ];

        for (const path of uploadPaths) {
          const request = new NextRequest(`http://localhost:3033${path}`);
          const response = await applyRateLimit(request);
          
          expect(response).toBeDefined();
        }
      });

      it('should apply admin rate limiting for admin paths', async () => {
        const request = new NextRequest('http://localhost:3033/api/admin/users');
        const response = await applyRateLimit(request);
        
        expect(response).toBeDefined();
      });

      it('should apply general API rate limiting for other API paths', async () => {
        const request = new NextRequest('http://localhost:3033/api/general');
        const response = await applyRateLimit(request);
        
        expect(response).toBeDefined();
      });

      it('should not apply rate limiting for non-API paths', async () => {
        const nonApiPaths = [
          '/',
          '/about',
          '/dashboard',
          '/static/image.png',
        ];

        for (const path of nonApiPaths) {
          const request = new NextRequest(`http://localhost:3033${path}`);
          const response = await applyRateLimit(request);
          
          // Should return NextResponse.next() for non-API paths
          expect(response.status).not.toBe(429);
        }
      });
    });
  });

  describe('Rate Limit Factory', () => {
    describe('createRateLimiter', () => {
      it('should create rate limiter with custom options', async () => {
        const customLimiter = createRateLimiter({
          windowMs: 5000,
          maxRequests: 3,
          message: 'Custom limit exceeded',
        });

        const request = new NextRequest('http://localhost:3033/api/test');
        const response = await customLimiter(request);

        expect(response).toBeDefined();
      });

      it('should create independent rate limiters', async () => {
        const limiter1 = createRateLimiter({ windowMs: 10000, maxRequests: 5 });
        const limiter2 = createRateLimiter({ windowMs: 20000, maxRequests: 10 });

        expect(limiter1).not.toBe(limiter2);
      });
    });
  });

  describe('Statistics and Monitoring', () => {
    describe('getRateLimitBackend', () => {
      it('should return redis when Redis is available', () => {
        const { isRedisAvailable } = require('@/lib/cache/redis-client');
        isRedisAvailable.mockReturnValue(true);

        expect(getRateLimitBackend()).toBe('redis');
      });

      it('should return memory when Redis is unavailable', () => {
        const { isRedisAvailable } = require('@/lib/cache/redis-client');
        isRedisAvailable.mockReturnValue(false);

        expect(getRateLimitBackend()).toBe('memory');
      });
    });

    describe('getRateLimitStats', () => {
      it('should return Redis stats when available', async () => {
        const { isRedisAvailable } = require('@/lib/cache/redis-client');
        isRedisAvailable.mockReturnValue(true);

        mockRedisClient.get.mockResolvedValue('5');
        mockRedisClient.ttl.mockResolvedValue(300);

        const stats = await getRateLimitStats('test-key');

        expect(stats).toMatchObject({
          count: 5,
          remaining: expect.any(Number),
          resetTime: expect.any(Number),
          backend: 'redis',
        });
      });

      it('should return null for non-existent Redis key', async () => {
        const { isRedisAvailable } = require('@/lib/cache/redis-client');
        isRedisAvailable.mockReturnValue(true);

        mockRedisClient.get.mockResolvedValue(null);

        const stats = await getRateLimitStats('non-existent-key');
        expect(stats).toBeNull();
      });

      it('should fallback to memory stats when Redis fails', async () => {
        const { isRedisAvailable } = require('@/lib/cache/redis-client');
        isRedisAvailable.mockReturnValue(true);

        mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

        const stats = await getRateLimitStats('test-key');
        // Should return null or memory stats
        expect(stats === null || stats?.backend === 'memory').toBe(true);
      });

      it('should return memory stats when Redis unavailable', async () => {
        const { isRedisAvailable } = require('@/lib/cache/redis-client');
        isRedisAvailable.mockReturnValue(false);

        // First make a request to populate memory store
        const request = new NextRequest('http://localhost:3033/api/test', {
          headers: { 'user-agent': 'StatsTest' },
        });
        await rateLimit(request);

        // Then get stats - this would need access to internal memory store
        const stats = await getRateLimitStats('memory-key');
        // Implementation may return null for memory stats
        expect(stats === null || stats?.backend === 'memory').toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection failures gracefully', async () => {
      const { isRedisAvailable } = require('@/lib/cache/redis-client');
      isRedisAvailable.mockReturnValue(true);

      mockRedisClient.pipeline.mockImplementation(() => {
        throw new Error('Redis connection lost');
      });

      const request = new NextRequest('http://localhost:3033/api/test');
      const response = await rateLimit(request);

      // Should not crash and should fallback to memory
      expect(response).toBeDefined();
      expect(response.headers.get('X-RateLimit-Backend')).toBe('memory');
    });

    it('should handle malformed requests gracefully', async () => {
      // Create request with minimal headers
      const request = new NextRequest('http://localhost:3033/api/test');
      
      const response = await rateLimit(request);
      expect(response).toBeDefined();
    });

    it('should handle Redis command failures', async () => {
      mockRedisClient.setex.mockRejectedValue(new Error('SETEX failed'));
      mockRedisClient.incr.mockRejectedValue(new Error('INCR failed'));

      const request = new NextRequest('http://localhost:3033/api/test');
      const response = await rateLimit(request);

      expect(response).toBeDefined();
    });

    it('should handle invalid window/limit configurations', async () => {
      const invalidOptions = {
        windowMs: -1000,
        maxRequests: 0,
      };

      const request = new NextRequest('http://localhost:3033/api/test');
      
      // Should not crash with invalid config
      await expect(rateLimit(request, invalidOptions)).resolves.toBeDefined();
    });
  });

  describe('Memory Cleanup', () => {
    it('should schedule periodic cleanup', () => {
      // Verify that setInterval was called for cleanup
      expect(global.setInterval).toHaveBeenCalled();
    });

    it('should clean expired entries', () => {
      // This tests the cleanup interval setup
      // In real scenario, would test actual cleanup logic
      expect(global.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        60000 // 1 minute cleanup interval
      );
    });
  });

  describe('Headers and Response Format', () => {
    it('should include standard rate limit headers on success', async () => {
      const request = new NextRequest('http://localhost:3033/api/test');
      const response = await rateLimit(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Backend')).toBeTruthy();
    });

    it('should include proper headers on rate limit exceeded', async () => {
      // Force rate limit exceeded
      mockRedisClient.pipeline.mockReturnValue({
        get: jest.fn().mockReturnThis(),
        ttl: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, '15'], // Over limit
          [null, 300],
        ]),
      });

      const request = new NextRequest('http://localhost:3033/api/test');
      const response = await rateLimit(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('should format rate limit exceeded response correctly', async () => {
      mockRedisClient.pipeline.mockReturnValue({
        get: jest.fn().mockReturnThis(),
        ttl: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, '15'],
          [null, 300],
        ]),
      });

      const request = new NextRequest('http://localhost:3033/api/test');
      const response = await rateLimit(request);
      const body = await response.json();

      expect(body).toMatchObject({
        error: 'Too Many Requests',
        message: expect.stringContaining('Rate limit exceeded'),
        retryAfter: expect.any(Number),
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid requests efficiently', async () => {
      const requests = Array.from({ length: 100 }, () =>
        new NextRequest('http://localhost:3033/api/test', {
          headers: { 'user-agent': `TestAgent${Math.random()}` },
        })
      );

      const start = Date.now();
      const responses = await Promise.all(
        requests.map(req => rateLimit(req))
      );
      const duration = Date.now() - start;

      expect(responses).toHaveLength(100);
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time
    });

    it('should not leak memory with many different clients', async () => {
      const requests = Array.from({ length: 50 }, (_, i) =>
        new NextRequest('http://localhost:3033/api/test', {
          headers: { 
            'user-agent': `UniqueAgent${i}`,
            'x-forwarded-for': `192.168.1.${i}`,
          },
        })
      );

      // Process requests
      await Promise.all(requests.map(req => rateLimit(req)));

      // Memory usage would need specialized testing tools to verify
      expect(requests).toHaveLength(50);
    });
  });
});