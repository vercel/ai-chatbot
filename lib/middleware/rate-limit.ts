/**
 * Rate Limiting Middleware for Next.js
 * Protection against API abuse with Redis backend and memory fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/lib/config/app-config';
import { redisClient, isRedisAvailable } from '@/lib/cache/redis-client';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Fallback in-memory store when Redis is unavailable
const memoryRateLimitStore = new Map<string, RateLimitEntry>();

// Clean expired entries periodically for memory fallback
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryRateLimitStore.entries()) {
    if (entry.resetTime < now) {
      memoryRateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Get unique client identifier
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Add user agent for more granularity
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create simple hash
  return `${ip}-${userAgent.substring(0, 50)}`;
}

/**
 * Redis-based rate limit check with memory fallback
 */
async function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetTime = now + windowMs;

  if (isRedisAvailable()) {
    try {
      return await checkRateLimitRedis(key, windowMs, maxRequests, now, resetTime);
    } catch (error) {
      console.warn('Redis rate limit check failed, falling back to memory:', error);
      return checkRateLimitMemory(key, windowMs, maxRequests, now, resetTime);
    }
  } else {
    return checkRateLimitMemory(key, windowMs, maxRequests, now, resetTime);
  }
}

/**
 * Redis implementation of rate limiting
 */
async function checkRateLimitRedis(
  key: string,
  windowMs: number,
  maxRequests: number,
  now: number,
  resetTime: number
): Promise<RateLimitResult> {
  const redisKey = `rate_limit:${key}`;
  const client = redisClient.getClient()!;

  // Use pipeline for atomic operations
  const pipeline = client.pipeline();
  
  // Get current count and TTL
  pipeline.get(redisKey);
  pipeline.ttl(redisKey);
  
  const results = await pipeline.exec();
  const currentCount = parseInt((results?.[0]?.[1] as string) || '0');
  const ttl = (results?.[1]?.[1] as number) || -1;

  let count = currentCount;
  let actualResetTime = resetTime;

  // If key exists and hasn't expired, increment
  if (ttl > 0) {
    count = currentCount + 1;
    actualResetTime = now + (ttl * 1000);
    
    if (count <= maxRequests) {
      await client.incr(redisKey);
    }
  } else {
    // New window or expired key
    count = 1;
    actualResetTime = resetTime;
    await client.setex(redisKey, Math.ceil(windowMs / 1000), '1');
  }

  const remaining = Math.max(0, maxRequests - count);
  const retryAfter = count > maxRequests ? Math.ceil((actualResetTime - now) / 1000) : undefined;

  return {
    success: count <= maxRequests,
    limit: maxRequests,
    remaining,
    resetTime: actualResetTime,
    retryAfter,
  };
}

/**
 * Memory fallback implementation of rate limiting
 */
function checkRateLimitMemory(
  key: string,
  windowMs: number,
  maxRequests: number,
  now: number,
  resetTime: number
): RateLimitResult {
  let entry = memoryRateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // New window
    entry = {
      count: 1,
      resetTime,
    };
    memoryRateLimitStore.set(key, entry);
  } else {
    // Increment counter
    entry.count++;
  }

  const remaining = Math.max(0, maxRequests - entry.count);
  const retryAfter = entry.count > maxRequests ? Math.ceil((entry.resetTime - now) / 1000) : undefined;

  return {
    success: entry.count <= maxRequests,
    limit: maxRequests,
    remaining,
    resetTime: entry.resetTime,
    retryAfter,
  };
}

/**
 * Rate limiting middleware with Redis backend and memory fallback
 */
export async function rateLimit(
  request: NextRequest,
  options?: {
    windowMs?: number;
    maxRequests?: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: NextRequest) => string;
  }
) {
  // Check if rate limiting is enabled
  if (!appConfig.isFeatureEnabled('enableRateLimiting')) {
    return NextResponse.next();
  }
  
  const config = appConfig.get('security').rateLimit;
  const windowMs = options?.windowMs || config.windowMs;
  const maxRequests = options?.maxRequests || config.maxRequests;
  
  // Generate unique key for the client
  const key = options?.keyGenerator 
    ? options.keyGenerator(request)
    : getClientIdentifier(request);
  
  // Check rate limit
  const result = await checkRateLimit(key, windowMs, maxRequests);
  
  // If rate limit exceeded
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': result.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
          'X-RateLimit-Backend': isRedisAvailable() ? 'redis' : 'memory',
        },
      }
    );
  }
  
  // Add informative headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
  response.headers.set('X-RateLimit-Backend', isRedisAvailable() ? 'redis' : 'memory');
  
  return response;
}

/**
 * Factory para criar rate limiters específicos
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  return async (request: NextRequest) => {
    return rateLimit(request, options);
  };
}

/**
 * Rate limiters pré-configurados
 */
export const rateLimiters = {
  // API geral - 100 requests por 15 minutos
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    message: 'Too many API requests',
  }),
  
  // Auth - 5 tentativas por 15 minutos
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts',
  }),
  
  // Claude AI - 30 requests por 5 minutos
  ai: createRateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 30,
    message: 'Too many AI requests',
  }),
  
  // Upload - 10 uploads por hora
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many uploads',
  }),
  
  // Strict - 1 request por minuto (para operações muito sensíveis)
  strict: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 1,
    message: 'Please wait before trying again',
  }),
};

/**
 * Middleware para aplicar rate limiting baseado no path
 */
export async function applyRateLimit(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Aplicar rate limiting específico baseado no path
  if (path.startsWith('/api/auth')) {
    return rateLimiters.auth(request);
  }
  
  if (path.startsWith('/api/claude') || path.startsWith('/api/ai')) {
    return rateLimiters.ai(request);
  }
  
  if (path.startsWith('/api/upload') || path.includes('/artifacts/save')) {
    return rateLimiters.upload(request);
  }
  
  if (path.startsWith('/api/admin')) {
    return rateLimiters.strict(request);
  }
  
  // Rate limiting geral para outras APIs
  if (path.startsWith('/api')) {
    return rateLimiters.api(request);
  }
  
  // Sem rate limiting para rotas não-API
  return NextResponse.next();
}

// Export types and utilities
export type RateLimiter = typeof rateLimiters[keyof typeof rateLimiters];
export type RateLimitOptions = Parameters<typeof rateLimit>[1];
export type { RateLimitResult, RateLimitEntry };

// Export backend status
export const getRateLimitBackend = () => isRedisAvailable() ? 'redis' : 'memory';

// Export rate limit statistics
export async function getRateLimitStats(key: string): Promise<{
  count: number;
  remaining: number;
  resetTime: number;
  backend: 'redis' | 'memory';
} | null> {
  if (isRedisAvailable()) {
    try {
      const redisKey = `rate_limit:${key}`;
      const client = redisClient.getClient()!;
      
      const [count, ttl] = await Promise.all([
        client.get(redisKey),
        client.ttl(redisKey)
      ]);
      
      if (count && ttl > 0) {
        const resetTime = Date.now() + (ttl * 1000);
        return {
          count: parseInt(count),
          remaining: Math.max(0, 100 - parseInt(count)), // Default limit, should be configurable
          resetTime,
          backend: 'redis'
        };
      }
    } catch (error) {
      console.warn('Failed to get rate limit stats from Redis:', error);
    }
  }
  
  // Fallback to memory
  const entry = memoryRateLimitStore.get(key);
  if (entry) {
    return {
      count: entry.count,
      remaining: Math.max(0, 100 - entry.count), // Default limit
      resetTime: entry.resetTime,
      backend: 'memory'
    };
  }
  
  return null;
}