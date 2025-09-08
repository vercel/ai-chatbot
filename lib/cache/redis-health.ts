/**
 * Redis Health Check System
 * Comprehensive monitoring and diagnostics for Redis connections
 */

import { redisClient, isRedisAvailable } from './redis-client';
import { cacheManager } from './cache-manager';
import { sessionManager } from './session-manager';
import { pubSubManager } from './pubsub-manager';

export interface RedisHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  checks: {
    connection: HealthCheckResult;
    performance: HealthCheckResult;
    memory: HealthCheckResult;
    persistence: HealthCheckResult;
    pubsub: HealthCheckResult;
    cache: HealthCheckResult;
    sessions: HealthCheckResult;
  };
  summary: {
    uptime: number;
    version: string;
    memory: {
      used: string;
      peak: string;
      fragmentation: number;
    };
    stats: {
      totalConnections: number;
      commandsProcessed: number;
      keyspaceHits: number;
      keyspaceMisses: number;
      hitRate: number;
    };
    persistence: {
      rdbLastSave: number;
      rdbChanges: number;
      aofEnabled: boolean;
      aofLastRewrite: number;
    };
  };
  recommendations: string[];
}

export interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail';
  duration: number;
  message: string;
  details?: any;
}

export interface HealthCheckOptions {
  timeout?: number;
  includeDetails?: boolean;
  checkPersistence?: boolean;
  checkPerformance?: boolean;
}

/**
 * Redis health monitoring system
 */
class RedisHealthChecker {
  private static instance: RedisHealthChecker;
  private healthHistory: RedisHealthStatus[] = [];
  private maxHistorySize = 100;
  private checkInterval?: NodeJS.Timeout;
  private alertThresholds = {
    responseTime: 100, // ms
    memoryUsage: 0.8, // 80%
    hitRate: 0.7, // 70%
    connectionErrors: 5,
  };

  private constructor() {}

  public static getInstance(): RedisHealthChecker {
    if (!RedisHealthChecker.instance) {
      RedisHealthChecker.instance = new RedisHealthChecker();
    }
    return RedisHealthChecker.instance;
  }

  /**
   * Perform comprehensive health check
   */
  public async performHealthCheck(options: HealthCheckOptions = {}): Promise<RedisHealthStatus> {
    const startTime = Date.now();
    const checks: RedisHealthStatus['checks'] = {
      connection: await this.checkConnection(options.timeout),
      performance: await this.checkPerformance(),
      memory: await this.checkMemory(),
      persistence: options.checkPersistence ? await this.checkPersistence() : this.skipCheck('Persistence check disabled'),
      pubsub: await this.checkPubSub(),
      cache: await this.checkCache(),
      sessions: await this.checkSessions(),
    };

    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => check.status === 'fail').length;
    const warnChecks = Object.values(checks).filter(check => check.status === 'warn').length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks > 0) {
      status = 'unhealthy';
    } else if (warnChecks > 1) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    // Get Redis info
    const summary = await this.getRedisInfo();
    const recommendations = this.generateRecommendations(checks, summary);

    const healthStatus: RedisHealthStatus = {
      status,
      timestamp: Date.now(),
      checks,
      summary,
      recommendations,
    };

    // Store in history
    this.addToHistory(healthStatus);

    return healthStatus;
  }

  private async checkConnection(timeout: number = 5000): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      if (!isRedisAvailable()) {
        return {
          status: 'fail',
          duration: Date.now() - startTime,
          message: 'Redis client not available',
        };
      }

      const client = redisClient.getClient();
      if (!client) {
        return {
          status: 'fail',
          duration: Date.now() - startTime,
          message: 'Redis client not initialized',
        };
      }

      // Test basic connectivity
      const pong = await Promise.race([
        client.ping(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ),
      ]);

      const duration = Date.now() - startTime;

      if (pong === 'PONG') {
        return {
          status: duration > this.alertThresholds.responseTime ? 'warn' : 'pass',
          duration,
          message: `Connection successful (${duration}ms)`,
          details: { responseTime: duration },
        };
      } else {
        return {
          status: 'fail',
          duration,
          message: 'Unexpected ping response',
          details: { response: pong },
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        duration: Date.now() - startTime,
        message: `Connection failed: ${error}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async checkPerformance(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!isRedisAvailable()) {
        return this.failCheck(startTime, 'Redis not available for performance check');
      }

      const client = redisClient.getClient()!;
      
      // Test various operations
      const testKey = `health_check:${Date.now()}`;
      const testData = JSON.stringify({ test: true, timestamp: Date.now() });

      const operations = await Promise.all([
        // SET operation
        client.set(testKey, testData),
        // GET operation
        client.get(testKey),
        // DEL operation
        client.del(testKey),
      ]);

      const duration = Date.now() - startTime;

      if (operations.every(op => op !== null)) {
        return {
          status: duration > this.alertThresholds.responseTime * 3 ? 'warn' : 'pass',
          duration,
          message: `Performance test passed (${duration}ms)`,
          details: { operationTime: duration },
        };
      } else {
        return {
          status: 'fail',
          duration,
          message: 'Some performance operations failed',
          details: { operations },
        };
      }
    } catch (error) {
      return this.failCheck(startTime, `Performance check failed: ${error}`);
    }
  }

  private async checkMemory(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!isRedisAvailable()) {
        return this.failCheck(startTime, 'Redis not available for memory check');
      }

      const client = redisClient.getClient()!;
      const info = await client.info('memory');
      
      const memoryInfo = this.parseRedisInfo(info);
      const usedMemory = parseInt(memoryInfo.used_memory || '0');
      const maxMemory = parseInt(memoryInfo.maxmemory || '0');
      
      const duration = Date.now() - startTime;
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'Memory usage within limits';

      if (maxMemory > 0) {
        const usageRatio = usedMemory / maxMemory;
        if (usageRatio > this.alertThresholds.memoryUsage) {
          status = 'warn';
          message = `High memory usage: ${(usageRatio * 100).toFixed(1)}%`;
        }
      }

      return {
        status,
        duration,
        message,
        details: {
          usedMemory,
          maxMemory,
          usedMemoryHuman: memoryInfo.used_memory_human,
          fragmentation: parseFloat(memoryInfo.mem_fragmentation_ratio || '1'),
        },
      };
    } catch (error) {
      return this.failCheck(startTime, `Memory check failed: ${error}`);
    }
  }

  private async checkPersistence(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!isRedisAvailable()) {
        return this.failCheck(startTime, 'Redis not available for persistence check');
      }

      const client = redisClient.getClient()!;
      const info = await client.info('persistence');
      
      const persistenceInfo = this.parseRedisInfo(info);
      const lastSave = parseInt(persistenceInfo.rdb_last_save_time || '0');
      const currentTime = Math.floor(Date.now() / 1000);
      const timeSinceLastSave = currentTime - lastSave;

      const duration = Date.now() - startTime;
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'Persistence working correctly';

      // Check if last save was too long ago (more than 1 hour)
      if (timeSinceLastSave > 3600) {
        status = 'warn';
        message = `Last save was ${Math.floor(timeSinceLastSave / 60)} minutes ago`;
      }

      return {
        status,
        duration,
        message,
        details: {
          rdbLastSave: lastSave,
          timeSinceLastSave,
          rdbChangesSinceLastSave: parseInt(persistenceInfo.rdb_changes_since_last_save || '0'),
          aofEnabled: persistenceInfo.aof_enabled === '1',
        },
      };
    } catch (error) {
      return this.failCheck(startTime, `Persistence check failed: ${error}`);
    }
  }

  private async checkPubSub(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const channels = pubSubManager.getActiveChannels();
      const stats = pubSubManager.getChannelStats();
      
      const duration = Date.now() - startTime;

      return {
        status: 'pass',
        duration,
        message: `Pub/Sub operational with ${channels.length} active channels`,
        details: {
          activeChannels: channels.length,
          totalSubscribers: stats.reduce((sum, stat) => sum + stat.subscribers, 0),
          totalMessages: stats.reduce((sum, stat) => sum + stat.messagesPublished, 0),
        },
      };
    } catch (error) {
      return this.failCheck(startTime, `Pub/Sub check failed: ${error}`);
    }
  }

  private async checkCache(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const stats = cacheManager.getStats();
      const info = await cacheManager.getInfo();
      
      const duration = Date.now() - startTime;
      const hitRate = stats.hits / (stats.hits + stats.misses) || 0;
      
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `Cache operational (hit rate: ${(hitRate * 100).toFixed(1)}%)`;

      if (hitRate < this.alertThresholds.hitRate) {
        status = 'warn';
        message = `Low cache hit rate: ${(hitRate * 100).toFixed(1)}%`;
      }

      return {
        status,
        duration,
        message,
        details: {
          stats,
          backend: info.redis.available ? 'redis' : 'memory',
          memoryEntries: info.memory.entries,
        },
      };
    } catch (error) {
      return this.failCheck(startTime, `Cache check failed: ${error}`);
    }
  }

  private async checkSessions(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const stats = await sessionManager.getStats();
      const duration = Date.now() - startTime;

      return {
        status: 'pass',
        duration,
        message: `Session storage operational (${stats.activeSessions} active sessions)`,
        details: {
          totalSessions: stats.totalSessions,
          activeSessions: stats.activeSessions,
          guestSessions: stats.guestSessions,
          authenticatedSessions: stats.authenticatedSessions,
          backend: stats.backend,
        },
      };
    } catch (error) {
      return this.failCheck(startTime, `Session check failed: ${error}`);
    }
  }

  private skipCheck(reason: string): HealthCheckResult {
    return {
      status: 'pass',
      duration: 0,
      message: reason,
    };
  }

  private failCheck(startTime: number, message: string): HealthCheckResult {
    return {
      status: 'fail',
      duration: Date.now() - startTime,
      message,
    };
  }

  private async getRedisInfo(): Promise<RedisHealthStatus['summary']> {
    const defaultSummary = {
      uptime: 0,
      version: 'unknown',
      memory: { used: '0', peak: '0', fragmentation: 0 },
      stats: { totalConnections: 0, commandsProcessed: 0, keyspaceHits: 0, keyspaceMisses: 0, hitRate: 0 },
      persistence: { rdbLastSave: 0, rdbChanges: 0, aofEnabled: false, aofLastRewrite: 0 },
    };

    try {
      if (!isRedisAvailable()) {
        return defaultSummary;
      }

      const client = redisClient.getClient()!;
      const [serverInfo, memoryInfo, statsInfo, persistenceInfo] = await Promise.all([
        client.info('server'),
        client.info('memory'),
        client.info('stats'),
        client.info('persistence'),
      ]);

      const server = this.parseRedisInfo(serverInfo);
      const memory = this.parseRedisInfo(memoryInfo);
      const stats = this.parseRedisInfo(statsInfo);
      const persistence = this.parseRedisInfo(persistenceInfo);

      const keyspaceHits = parseInt(stats.keyspace_hits || '0');
      const keyspaceMisses = parseInt(stats.keyspace_misses || '0');
      const hitRate = keyspaceHits + keyspaceMisses > 0 ? keyspaceHits / (keyspaceHits + keyspaceMisses) : 0;

      return {
        uptime: parseInt(server.uptime_in_seconds || '0'),
        version: server.redis_version || 'unknown',
        memory: {
          used: memory.used_memory_human || '0',
          peak: memory.used_memory_peak_human || '0',
          fragmentation: parseFloat(memory.mem_fragmentation_ratio || '1'),
        },
        stats: {
          totalConnections: parseInt(stats.total_connections_received || '0'),
          commandsProcessed: parseInt(stats.total_commands_processed || '0'),
          keyspaceHits,
          keyspaceMisses,
          hitRate,
        },
        persistence: {
          rdbLastSave: parseInt(persistence.rdb_last_save_time || '0'),
          rdbChanges: parseInt(persistence.rdb_changes_since_last_save || '0'),
          aofEnabled: persistence.aof_enabled === '1',
          aofLastRewrite: parseInt(persistence.aof_last_rewrite_time_sec || '0'),
        },
      };
    } catch (error) {
      console.warn('Failed to get Redis info:', error);
      return defaultSummary;
    }
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value !== undefined) {
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  private generateRecommendations(
    checks: RedisHealthStatus['checks'],
    summary: RedisHealthStatus['summary']
  ): string[] {
    const recommendations: string[] = [];

    // Connection issues
    if (checks.connection.status === 'fail') {
      recommendations.push('Check Redis server status and network connectivity');
      recommendations.push('Verify Redis configuration and authentication');
    }

    // Performance issues
    if (checks.performance.status === 'warn' || checks.performance.status === 'fail') {
      recommendations.push('Consider optimizing Redis configuration for better performance');
      recommendations.push('Review application query patterns and data structures');
    }

    // Memory issues
    if (checks.memory.status === 'warn') {
      recommendations.push('Consider increasing Redis memory limit or implementing data eviction policies');
      recommendations.push('Review cache TTL settings and data retention policies');
    }

    // Cache hit rate
    if (summary.stats.hitRate < this.alertThresholds.hitRate) {
      recommendations.push('Optimize cache keys and TTL settings to improve hit rate');
      recommendations.push('Review caching strategy and frequently accessed data patterns');
    }

    // Memory fragmentation
    if (summary.memory.fragmentation > 1.5) {
      recommendations.push('Consider Redis memory defragmentation or restart during low usage');
    }

    // Persistence
    if (checks.persistence.status === 'warn') {
      recommendations.push('Check Redis persistence configuration (RDB/AOF)');
      recommendations.push('Ensure adequate disk space for Redis snapshots');
    }

    return recommendations;
  }

  private addToHistory(status: RedisHealthStatus): void {
    this.healthHistory.push(status);
    
    // Keep only recent history
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift();
    }
  }

  /**
   * Get health check history
   */
  public getHealthHistory(limit?: number): RedisHealthStatus[] {
    return limit ? this.healthHistory.slice(-limit) : [...this.healthHistory];
  }

  /**
   * Start periodic health checks
   */
  public startPeriodicHealthChecks(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        await this.performHealthCheck({ includeDetails: false });
      } catch (error) {
        console.error('Periodic health check failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop periodic health checks
   */
  public stopPeriodicHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * Get current Redis status summary
   */
  public async getStatusSummary(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    connections: number;
    memoryUsage: string;
    hitRate: number;
    activeChannels: number;
    activeSessions: number;
  }> {
    try {
      const healthCheck = await this.performHealthCheck({ includeDetails: false });
      const pubsubStats = pubSubManager.getChannelStats();
      const sessionStats = await sessionManager.getStats();

      return {
        status: healthCheck.status,
        uptime: healthCheck.summary.uptime,
        connections: healthCheck.summary.stats.totalConnections,
        memoryUsage: healthCheck.summary.memory.used,
        hitRate: healthCheck.summary.stats.hitRate,
        activeChannels: pubsubStats.length,
        activeSessions: sessionStats.activeSessions,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        uptime: 0,
        connections: 0,
        memoryUsage: 'unknown',
        hitRate: 0,
        activeChannels: 0,
        activeSessions: 0,
      };
    }
  }

  /**
   * Shutdown health checker
   */
  public shutdown(): void {
    this.stopPeriodicHealthChecks();
    this.healthHistory = [];
  }
}

// Export singleton instance
export const redisHealthChecker = RedisHealthChecker.getInstance();

// Export types
export type { HealthCheckResult, HealthCheckOptions };

// Export utilities
export const performHealthCheck = (options?: HealthCheckOptions) => 
  redisHealthChecker.performHealthCheck(options);
export const getHealthHistory = (limit?: number) => 
  redisHealthChecker.getHealthHistory(limit);
export const getStatusSummary = () => 
  redisHealthChecker.getStatusSummary();
export const startHealthMonitoring = (interval?: number) => 
  redisHealthChecker.startPeriodicHealthChecks(interval);

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => redisHealthChecker.shutdown());
  process.on('SIGINT', () => redisHealthChecker.shutdown());
}

export default redisHealthChecker;