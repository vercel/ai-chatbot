/**
 * Redis Cache System - Complete Implementation
 * Export all Redis-related functionality with fallback support
 */

// Core Redis client
export { 
  redisClient, 
  isRedisAvailable, 
  getRedisHealth,
  type RedisConnectionState
} from './redis-client';

// Cache management
export { 
  cacheManager, 
  AICacheManager,
  clearAllCache,
  getCacheStats,
  getCacheInfo,
  type CacheOptions,
  type CacheStats,
  type CacheEntry
} from './cache-manager';

// Session management
export { 
  sessionManager, 
  GuestSessionManager,
  createGuestSession,
  getGuestSession,
  getSessionStats,
  type SessionData,
  type SessionOptions,
  type SessionStats
} from './session-manager';

// Pub/Sub messaging
export { 
  pubSubManager, 
  RealTimeManager,
  subscribe,
  unsubscribe,
  publish,
  getChannelStats,
  type PubSubMessage,
  type PubSubOptions,
  type ChannelStats,
  type MessageHandler
} from './pubsub-manager';

// Health monitoring
export { 
  redisHealthChecker,
  performHealthCheck,
  getHealthHistory,
  getStatusSummary,
  startHealthMonitoring,
  type RedisHealthStatus,
  type HealthCheckResult,
  type HealthCheckOptions
} from './redis-health';

// Fallback management
export { 
  fallbackManager,
  FallbackCache,
  getFallbackStats,
  syncWithRedis,
  clearFallback,
  type FallbackOptions,
  type FallbackStats,
  type FallbackData
} from './fallback-manager';

// Rate limiting (updated with Redis support)
export {
  rateLimit,
  createRateLimiter,
  rateLimiters,
  applyRateLimit,
  getRateLimitBackend,
  getRateLimitStats,
  type RateLimiter,
  type RateLimitOptions,
  type RateLimitResult,
  type RateLimitEntry
} from '../middleware/rate-limit';

/**
 * Initialize Redis system with all components
 */
export async function initializeRedisSystem(options?: {
  enableHealthMonitoring?: boolean;
  healthCheckInterval?: number;
  enableFallback?: boolean;
  fallbackOptions?: import('./fallback-manager').FallbackOptions;
}): Promise<{
  success: boolean;
  components: {
    redis: boolean;
    cache: boolean;
    sessions: boolean;
    pubsub: boolean;
    fallback: boolean;
  };
  message: string;
}> {
  const components = {
    redis: false,
    cache: false,
    sessions: false,
    pubsub: false,
    fallback: false,
  };

  try {
    // Check Redis availability
    components.redis = isRedisAvailable();
    
    // Initialize cache manager
    try {
      await cacheManager.getInfo();
      components.cache = true;
    } catch (error) {
      console.warn('Cache manager initialization failed:', error);
    }

    // Initialize session manager
    try {
      await sessionManager.getStats();
      components.sessions = true;
    } catch (error) {
      console.warn('Session manager initialization failed:', error);
    }

    // Initialize pub/sub manager
    try {
      pubSubManager.getActiveChannels();
      components.pubsub = true;
    } catch (error) {
      console.warn('Pub/Sub manager initialization failed:', error);
    }

    // Initialize fallback system
    if (options?.enableFallback !== false) {
      try {
        fallbackManager.getStats();
        components.fallback = true;
      } catch (error) {
        console.warn('Fallback manager initialization failed:', error);
      }
    }

    // Start health monitoring
    if (options?.enableHealthMonitoring !== false) {
      try {
        const healthChecker = redisHealthChecker;
        healthChecker.startPeriodicHealthChecks(options?.healthCheckInterval);
      } catch (error) {
        console.warn('Health monitoring initialization failed:', error);
      }
    }

    const successCount = Object.values(components).filter(Boolean).length;
    const success = successCount > 0;

    return {
      success,
      components,
      message: success 
        ? `Redis system initialized (${successCount}/5 components active)`
        : 'Redis system initialization failed'
    };

  } catch (error) {
    return {
      success: false,
      components,
      message: `Redis system initialization error: ${error}`
    };
  }
}

/**
 * Shutdown Redis system gracefully
 */
export async function shutdownRedisSystem(): Promise<void> {
  console.log('Shutting down Redis system...');
  
  const shutdownPromises = [
    redisClient.shutdown(),
    cacheManager.shutdown(),
    sessionManager.shutdown(),
    pubSubManager.shutdown(),
    fallbackManager.shutdown(),
  ];

  try {
    await Promise.all(shutdownPromises);
    console.log('Redis system shut down successfully');
  } catch (error) {
    console.error('Error during Redis system shutdown:', error);
  }
}

/**
 * Get comprehensive system status
 */
export async function getSystemStatus(): Promise<{
  redis: {
    available: boolean;
    status?: import('./redis-health').RedisHealthStatus;
  };
  cache: {
    backend: 'redis' | 'memory' | 'hybrid';
    stats: import('./cache-manager').CacheStats;
  };
  sessions: {
    backend: 'redis' | 'memory' | 'hybrid';
    stats: import('./session-manager').SessionStats;
  };
  pubsub: {
    channels: number;
    stats: import('./pubsub-manager').ChannelStats[];
  };
  fallback: {
    active: boolean;
    stats: import('./fallback-manager').FallbackStats;
  };
  overall: 'healthy' | 'degraded' | 'unhealthy';
}> {
  try {
    const [cacheStats, sessionStats, pubsubStats, fallbackStats] = await Promise.all([
      cacheManager.getStats(),
      sessionManager.getStats(),
      pubSubManager.getChannelStats(),
      fallbackManager.getStats(),
    ]);

    let redisStatus;
    try {
      redisStatus = await redisHealthChecker.performHealthCheck();
    } catch (error) {
      redisStatus = null;
    }

    const status = {
      redis: {
        available: isRedisAvailable(),
        status: redisStatus,
      },
      cache: {
        backend: cacheStats.backend,
        stats: cacheStats,
      },
      sessions: {
        backend: sessionStats.backend,
        stats: sessionStats,
      },
      pubsub: {
        channels: pubsubStats.length,
        stats: pubsubStats,
      },
      fallback: {
        active: fallbackStats.isUsingFallback,
        stats: fallbackStats,
      },
      overall: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    };

    // Determine overall status
    if (!status.redis.available && status.fallback.active) {
      status.overall = 'degraded';
    } else if (!status.redis.available && !status.fallback.active) {
      status.overall = 'unhealthy';
    } else if (redisStatus && redisStatus.status !== 'healthy') {
      status.overall = redisStatus.status;
    }

    return status;
  } catch (error) {
    console.error('Failed to get system status:', error);
    return {
      redis: { available: false },
      cache: { backend: 'memory', stats: { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0, backend: 'memory' } },
      sessions: { backend: 'memory', stats: { totalSessions: 0, activeSessions: 0, guestSessions: 0, authenticatedSessions: 0, backend: 'memory' } },
      pubsub: { channels: 0, stats: [] },
      fallback: { active: true, stats: { isUsingFallback: true, memoryUsage: 0, totalKeys: 0, syncStatus: 'never', redisAvailable: false } },
      overall: 'unhealthy',
    };
  }
}

// Default export for easy usage
export default {
  // Core components
  redisClient,
  cacheManager,
  sessionManager,
  pubSubManager,
  redisHealthChecker,
  fallbackManager,
  
  // Utilities
  initializeRedisSystem,
  shutdownRedisSystem,
  getSystemStatus,
  isRedisAvailable,
  
  // Specialized managers
  AICacheManager,
  GuestSessionManager,
  RealTimeManager,
  FallbackCache,
};