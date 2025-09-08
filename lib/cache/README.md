# Redis Implementation for AI Chatbot

A comprehensive Redis implementation with automatic fallback to memory storage, providing robust caching, session management, pub/sub messaging, and health monitoring for the AI chatbot project.

## Features

- ✅ **Redis Client** with connection pooling and retry logic
- ✅ **Rate Limiting** with Redis backend and memory fallback
- ✅ **Cache Manager** for AI response caching with TTL
- ✅ **Session Storage** for guest users with Redis persistence
- ✅ **Pub/Sub Messaging** for real-time features
- ✅ **Health Monitoring** with comprehensive diagnostics
- ✅ **Automatic Fallback** to memory when Redis is unavailable
- ✅ **Data Synchronization** when Redis comes back online

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
├─────────────────────────────────────────────────────────┤
│  Rate Limiting │  Caching  │  Sessions  │  Pub/Sub      │
├─────────────────────────────────────────────────────────┤
│              Fallback Management Layer                   │
├─────────────────────────────────────────────────────────┤
│                Redis Client Layer                       │
├─────────────────────────────────────────────────────────┤
│              Health Monitoring                          │
├─────────────────────────────────────────────────────────┤
│     Redis Server        │      Memory Fallback         │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Environment Setup

Copy the environment template:
```bash
cp .env.redis.example .env.local
```

Configure your Redis settings in `.env.local`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
```

### 2. Initialize Redis System

```typescript
import { initializeRedisSystem } from '@/lib/cache';

// Initialize all Redis components
const result = await initializeRedisSystem({
  enableHealthMonitoring: true,
  healthCheckInterval: 30000, // 30 seconds
  enableFallback: true,
  fallbackOptions: {
    enableAutoSync: true,
    maxMemorySize: 100, // 100MB
  }
});

console.log('Redis system:', result.success ? 'initialized' : 'failed');
```

### 3. Basic Usage Examples

#### Caching
```typescript
import { cacheManager, AICacheManager } from '@/lib/cache';

// Basic caching
await cacheManager.set('user:123', userData, { ttl: 3600 });
const user = await cacheManager.get('user:123');

// AI response caching
await AICacheManager.cacheResponse(prompt, response, 'claude-3', 86400);
const cached = await AICacheManager.getCachedResponse(prompt, 'claude-3');
```

#### Sessions
```typescript
import { sessionManager, createGuestSession } from '@/lib/cache';

// Create guest session
const sessionId = await createGuestSession({ theme: 'dark' });

// Update session data
await sessionManager.updateSession(sessionId, { lastActivity: Date.now() });

// Get session
const session = await sessionManager.getSession(sessionId);
```

#### Pub/Sub
```typescript
import { pubSubManager, RealTimeManager } from '@/lib/cache';

// Subscribe to messages
await pubSubManager.subscribe('chat:room1', (message) => {
  console.log('New message:', message.data);
});

// Publish message
await pubSubManager.publish('chat:room1', {
  type: 'message',
  content: 'Hello world!',
  user: 'john'
});

// Real-time AI responses
await RealTimeManager.broadcastAIResponse('conv123', response, 'user456');
```

#### Rate Limiting
```typescript
import { rateLimit, rateLimiters } from '@/lib/cache';

// Apply rate limiting middleware
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimiters.ai(request);
  if (rateLimitResult.status === 429) {
    return rateLimitResult;
  }
  // ... handle request
}
```

## Component Details

### Redis Client (`redis-client.ts`)

Features:
- Automatic connection pooling
- Retry logic with exponential backoff
- Health monitoring
- Graceful reconnection
- Support for pub/sub channels

```typescript
import { redisClient, isRedisAvailable } from '@/lib/cache/redis-client';

// Check if Redis is available
if (isRedisAvailable()) {
  const client = redisClient.getClient();
  // Use Redis client
}

// Get connection state
const state = redisClient.getConnectionState();
console.log('Connected:', state.isConnected);
```

### Cache Manager (`cache-manager.ts`)

Features:
- Automatic Redis/memory fallback
- TTL support
- Data compression for large objects
- Cache-aside pattern
- Statistics tracking

```typescript
import { cacheManager, AICacheManager } from '@/lib/cache/cache-manager';

// Get or generate value
const data = await cacheManager.getOrSet('expensive-op', async () => {
  return await performExpensiveOperation();
}, { ttl: 3600 });

// AI-specific caching
await AICacheManager.cacheConversation('conv123', conversationData);
```

### Session Manager (`session-manager.ts`)

Features:
- Guest session support
- Automatic cleanup of expired sessions
- User session management
- Redis persistence with memory fallback
- Session statistics

```typescript
import { sessionManager, GuestSessionManager } from '@/lib/cache/session-manager';

// Create authenticated session
const sessionId = await sessionManager.createSession('user123', initialData);

// Guest session helpers
const guestId = await GuestSessionManager.createGuestSession();
await GuestSessionManager.updateGuestSession(guestId, { preference: 'value' });
```

### Pub/Sub Manager (`pubsub-manager.ts`)

Features:
- Redis pub/sub with EventEmitter fallback
- Pattern matching support
- Message buffering when Redis unavailable
- Persistent messages
- Real-time helpers

```typescript
import { pubSubManager, RealTimeManager } from '@/lib/cache/pubsub-manager';

// Advanced pub/sub
await pubSubManager.subscribe('notifications:*', handler, { pattern: true });
await pubSubManager.publish('notifications:user123', data, { persistent: true });

// Real-time features
await RealTimeManager.broadcastTyping('conv123', 'user456', true);
await RealTimeManager.subscribeToPresence('user456', presenceHandler);
```

### Health Checker (`redis-health.ts`)

Features:
- Comprehensive health diagnostics
- Performance monitoring
- Memory usage tracking
- Persistence status
- Component health checks
- Automatic recommendations

```typescript
import { performHealthCheck, startHealthMonitoring } from '@/lib/cache/redis-health';

// Perform health check
const health = await performHealthCheck({
  timeout: 5000,
  includeDetails: true,
  checkPersistence: true,
  checkPerformance: true
});

console.log('Redis status:', health.status);
console.log('Recommendations:', health.recommendations);

// Start periodic monitoring
startHealthMonitoring(30000); // Every 30 seconds
```

### Fallback Manager (`fallback-manager.ts`)

Features:
- Automatic fallback to memory
- Data synchronization when Redis returns
- Memory usage limits
- Export/import functionality
- Event notifications

```typescript
import { fallbackManager, FallbackCache } from '@/lib/cache/fallback-manager';

// Automatic fallback operations
await fallbackManager.set('key', 'value', 3600);
const value = await fallbackManager.get('key');

// Memoization with fallback
const memoizedFn = FallbackCache.memoize(expensiveFunction, {
  keyGenerator: (arg) => `fn:${arg}`,
  ttl: 3600
});
```

## API Endpoints

### Health Check Endpoint

```typescript
// GET /api/health/redis
// Returns comprehensive Redis system health

// Quick status
GET /api/health/redis?type=summary

// Detailed system status
GET /api/health/redis?type=system&detailed=true

// Full health check
GET /api/health/redis?type=full
```

Response format:
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": 1234567890,
  "checks": {
    "connection": { "status": "pass", "duration": 10, "message": "Connected" },
    "performance": { "status": "pass", "duration": 25, "message": "Performance OK" },
    "memory": { "status": "warn", "duration": 5, "message": "High usage: 85%" }
  },
  "summary": {
    "uptime": 86400,
    "version": "7.0.0",
    "memory": { "used": "1.2GB", "peak": "1.5GB", "fragmentation": 1.2 },
    "stats": { "hitRate": 0.85, "totalConnections": 100 }
  },
  "recommendations": ["Consider increasing memory limit"]
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | localhost | Redis server hostname |
| `REDIS_PORT` | 6379 | Redis server port |
| `REDIS_PASSWORD` | - | Redis password |
| `REDIS_DB` | 0 | Database number |
| `REDIS_KEY_PREFIX` | ai-chatbot: | Key prefix |
| `REDIS_CONNECTION_TIMEOUT` | 10000 | Connection timeout (ms) |
| `REDIS_COMMAND_TIMEOUT` | 5000 | Command timeout (ms) |
| `REDIS_MAX_RETRIES` | 3 | Maximum retry attempts |
| `REDIS_FALLBACK_ENABLED` | true | Enable fallback mode |
| `REDIS_FALLBACK_MAX_MEMORY` | 100 | Max fallback memory (MB) |

### Redis Server Configuration

Recommended Redis configuration:
```conf
# Memory management
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Performance
tcp-keepalive 300
timeout 300

# Security
requirepass your_secure_password
```

## Monitoring and Maintenance

### Health Monitoring

The system includes comprehensive health monitoring:

1. **Connection Health**: Tests Redis connectivity and response time
2. **Performance Health**: Measures operation latency
3. **Memory Health**: Monitors memory usage and fragmentation
4. **Persistence Health**: Checks RDB/AOF status
5. **Component Health**: Tests cache, sessions, and pub/sub

### Metrics and Statistics

Available metrics:
- Cache hit/miss ratios
- Session counts (guest vs authenticated)
- Pub/sub channel activity
- Redis memory usage
- Connection statistics
- Fallback usage

### Maintenance Tasks

1. **Memory Cleanup**: Automatic cleanup of expired keys
2. **Data Sync**: Automatic synchronization when Redis reconnects
3. **Health Checks**: Periodic health monitoring
4. **Statistics**: Real-time metrics collection

## Best Practices

### Performance

1. **Use appropriate TTLs**: Set reasonable expiration times
2. **Batch operations**: Use pipelines for multiple operations
3. **Monitor memory**: Keep track of Redis memory usage
4. **Optimize keys**: Use consistent, efficient key naming

### Reliability

1. **Enable fallback**: Always have memory fallback enabled
2. **Monitor health**: Use health checks and monitoring
3. **Handle errors**: Graceful degradation when Redis fails
4. **Plan capacity**: Size Redis appropriately

### Security

1. **Use passwords**: Always set Redis passwords
2. **Network security**: Use proper firewall rules
3. **Key prefixes**: Use consistent prefixes for isolation
4. **Access control**: Limit Redis access to application only

## Troubleshooting

### Common Issues

1. **Redis connection failed**
   - Check Redis server status
   - Verify network connectivity
   - Check credentials and configuration

2. **High memory usage**
   - Review TTL settings
   - Check for memory leaks
   - Consider data eviction policies

3. **Poor cache hit rates**
   - Analyze access patterns
   - Optimize cache keys and TTLs
   - Review caching strategy

4. **Pub/sub message loss**
   - Check Redis connection stability
   - Review message persistence settings
   - Monitor fallback usage

### Debug Commands

```typescript
// Check system status
const status = await getSystemStatus();
console.log('System status:', status);

// Get detailed health info
const health = await performHealthCheck({ includeDetails: true });
console.log('Health details:', health);

// Check fallback stats
const fallbackStats = getFallbackStats();
console.log('Fallback usage:', fallbackStats);
```

## Development and Testing

### Testing Redis Integration

```typescript
// Test cache functionality
const testKey = `test:${Date.now()}`;
await cacheManager.set(testKey, 'test value', { ttl: 60 });
const retrieved = await cacheManager.get(testKey);
console.log('Cache test:', retrieved === 'test value' ? 'PASS' : 'FAIL');

// Test fallback functionality
await fallbackManager.forceFallbackMode(true);
// ... run tests with fallback mode
await fallbackManager.forceFallbackMode(false);
```

### Local Development Setup

1. Install Redis locally or use Docker:
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

2. Configure environment variables
3. Initialize the Redis system
4. Monitor health endpoint

## Migration and Deployment

### Production Deployment

1. **Redis Setup**: Configure Redis server with persistence
2. **Environment**: Set production environment variables
3. **Monitoring**: Enable health monitoring and alerting
4. **Backup**: Configure Redis backup strategy
5. **Scaling**: Plan for Redis scaling needs

### Data Migration

The system supports graceful migration:
- Automatic fallback during Redis downtime
- Data synchronization when Redis comes back online
- Export/import functionality for data migration

This implementation provides a robust, production-ready Redis integration with comprehensive fallback support, ensuring your AI chatbot remains operational even when Redis is unavailable.