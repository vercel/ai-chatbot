/**
 * Fallback Manager
 * Provides seamless fallback to memory storage when Redis is unavailable
 * Ensures application resilience and data continuity
 */

import { EventEmitter } from 'events';
import { redisClient, isRedisAvailable } from './redis-client';

export interface FallbackOptions {
  enableAutoSync?: boolean; // Sync data when Redis comes back online
  maxMemorySize?: number; // Maximum memory usage in MB
  syncInterval?: number; // Sync interval in seconds
  persistentFallback?: boolean; // Keep fallback data in memory even when Redis is available
}

export interface FallbackStats {
  isUsingFallback: boolean;
  memoryUsage: number; // in MB
  totalKeys: number;
  syncStatus: 'synced' | 'syncing' | 'failed' | 'never';
  lastSyncTime?: number;
  redisAvailable: boolean;
}

export interface FallbackData {
  [key: string]: {
    value: any;
    expiry?: number;
    timestamp: number;
  };
}

/**
 * Comprehensive fallback management system
 */
class FallbackManager {
  private static instance: FallbackManager;
  private eventEmitter = new EventEmitter();
  private fallbackData: FallbackData = {};
  private syncQueue: Array<{ key: string; value: any; expiry?: number }> = [];
  private options: FallbackOptions;
  private syncInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private stats: FallbackStats = {
    isUsingFallback: false,
    memoryUsage: 0,
    totalKeys: 0,
    syncStatus: 'never',
    redisAvailable: false,
  };

  private constructor(options: FallbackOptions = {}) {
    this.options = {
      enableAutoSync: true,
      maxMemorySize: 100, // 100MB default
      syncInterval: 30, // 30 seconds default
      persistentFallback: false,
      ...options,
    };

    this.setupEventHandlers();
    this.startPeriodicTasks();
  }

  public static getInstance(options?: FallbackOptions): FallbackManager {
    if (!FallbackManager.instance) {
      FallbackManager.instance = new FallbackManager(options);
    }
    return FallbackManager.instance;
  }

  private setupEventHandlers(): void {
    // Monitor Redis availability
    setInterval(() => {
      const wasAvailable = this.stats.redisAvailable;
      const isAvailable = isRedisAvailable();
      
      if (wasAvailable !== isAvailable) {
        this.stats.redisAvailable = isAvailable;
        
        if (isAvailable && !wasAvailable) {
          this.eventEmitter.emit('redis:connected');
          this.handleRedisReconnection();
        } else if (!isAvailable && wasAvailable) {
          this.eventEmitter.emit('redis:disconnected');
          this.handleRedisDisconnection();
        }
      }
    }, 5000); // Check every 5 seconds
  }

  private startPeriodicTasks(): void {
    // Cleanup expired keys
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredKeys();
    }, 60000); // Every minute

    // Auto-sync if enabled
    if (this.options.enableAutoSync && this.options.syncInterval) {
      this.syncInterval = setInterval(() => {
        this.syncWithRedis().catch(console.error);
      }, this.options.syncInterval * 1000);
    }
  }

  private handleRedisReconnection(): void {
    console.log('Redis reconnected, initiating data sync...');
    this.syncWithRedis().catch(console.error);
  }

  private handleRedisDisconnection(): void {
    console.log('Redis disconnected, activating fallback mode...');
    this.stats.isUsingFallback = true;
    this.eventEmitter.emit('fallback:activated');
  }

  private cleanupExpiredKeys(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, data] of Object.entries(this.fallbackData)) {
      if (data.expiry && data.expiry < now) {
        delete this.fallbackData[key];
        cleaned++;
      }
    }

    this.updateStats();
    
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} expired fallback keys`);
    }
  }

  private updateStats(): void {
    const dataStr = JSON.stringify(this.fallbackData);
    this.stats.memoryUsage = Buffer.byteLength(dataStr, 'utf8') / 1024 / 1024; // MB
    this.stats.totalKeys = Object.keys(this.fallbackData).length;
    this.stats.redisAvailable = isRedisAvailable();
    this.stats.isUsingFallback = !this.stats.redisAvailable || this.options.persistentFallback!;
  }

  /**
   * Get value with automatic fallback
   */
  public async get<T = any>(key: string, ttlSeconds?: number): Promise<T | null> {
    // Try Redis first if available
    if (isRedisAvailable() && !this.options.persistentFallback) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const value = await client.get(key);
          if (value !== null) {
            try {
              return JSON.parse(value);
            } catch {
              return value as T;
            }
          }
        }
      } catch (error) {
        console.warn(`Redis get failed for key ${key}, using fallback:`, error);
      }
    }

    // Fallback to memory
    const data = this.fallbackData[key];
    if (!data) {
      return null;
    }

    // Check expiry
    if (data.expiry && data.expiry < Date.now()) {
      delete this.fallbackData[key];
      this.updateStats();
      return null;
    }

    return data.value;
  }

  /**
   * Set value with automatic fallback
   */
  public async set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
    let success = false;

    // Try Redis first if available
    if (isRedisAvailable() && !this.options.persistentFallback) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
          
          if (ttlSeconds) {
            await client.setex(key, ttlSeconds, serializedValue);
          } else {
            await client.set(key, serializedValue);
          }
          
          success = true;
        }
      } catch (error) {
        console.warn(`Redis set failed for key ${key}, using fallback:`, error);
      }
    }

    // Always store in fallback (for resilience or persistent fallback mode)
    if (!success || this.options.persistentFallback) {
      // Check memory limits
      if (!this.checkMemoryLimits()) {
        console.warn('Fallback memory limit exceeded, cannot store new data');
        return success;
      }

      this.fallbackData[key] = {
        value,
        expiry,
        timestamp: Date.now(),
      };

      // Add to sync queue if Redis is not available
      if (!isRedisAvailable() && this.options.enableAutoSync) {
        this.syncQueue.push({ key, value, expiry: ttlSeconds });
      }

      this.updateStats();
      success = true;
    }

    return success;
  }

  /**
   * Delete value with automatic fallback
   */
  public async delete(key: string): Promise<boolean> {
    let success = false;

    // Try Redis first
    if (isRedisAvailable() && !this.options.persistentFallback) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const result = await client.del(key);
          success = result > 0;
        }
      } catch (error) {
        console.warn(`Redis delete failed for key ${key}:`, error);
      }
    }

    // Delete from fallback
    if (this.fallbackData[key]) {
      delete this.fallbackData[key];
      this.updateStats();
      success = true;
    }

    return success;
  }

  /**
   * Check if key exists with automatic fallback
   */
  public async exists(key: string): Promise<boolean> {
    // Try Redis first
    if (isRedisAvailable() && !this.options.persistentFallback) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const exists = await client.exists(key);
          return exists === 1;
        }
      } catch (error) {
        console.warn(`Redis exists check failed for key ${key}:`, error);
      }
    }

    // Check fallback
    const data = this.fallbackData[key];
    if (!data) {
      return false;
    }

    // Check expiry
    if (data.expiry && data.expiry < Date.now()) {
      delete this.fallbackData[key];
      this.updateStats();
      return false;
    }

    return true;
  }

  /**
   * Get multiple values with automatic fallback
   */
  public async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = [];

    // Try Redis first
    if (isRedisAvailable() && !this.options.persistentFallback) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const values = await client.mget(...keys);
          return values.map(value => {
            if (value === null) return null;
            try {
              return JSON.parse(value);
            } catch {
              return value as T;
            }
          });
        }
      } catch (error) {
        console.warn('Redis mget failed, using fallback:', error);
      }
    }

    // Fallback to memory
    for (const key of keys) {
      const value = await this.get<T>(key);
      results.push(value);
    }

    return results;
  }

  /**
   * Set multiple values with automatic fallback
   */
  public async mset(keyValues: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
    let success = false;

    // Try Redis first
    if (isRedisAvailable() && !this.options.persistentFallback) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const pipeline = client.pipeline();
          
          for (const [key, value] of Object.entries(keyValues)) {
            const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
            
            if (ttlSeconds) {
              pipeline.setex(key, ttlSeconds, serializedValue);
            } else {
              pipeline.set(key, serializedValue);
            }
          }
          
          await pipeline.exec();
          success = true;
        }
      } catch (error) {
        console.warn('Redis mset failed, using fallback:', error);
      }
    }

    // Fallback to memory
    if (!success || this.options.persistentFallback) {
      for (const [key, value] of Object.entries(keyValues)) {
        await this.set(key, value, ttlSeconds);
      }
      success = true;
    }

    return success;
  }

  /**
   * Sync fallback data with Redis
   */
  public async syncWithRedis(): Promise<void> {
    if (!isRedisAvailable() || !this.options.enableAutoSync) {
      return;
    }

    try {
      this.stats.syncStatus = 'syncing';
      const client = redisClient.getClient();
      if (!client) return;

      // Sync queued operations
      if (this.syncQueue.length > 0) {
        console.log(`Syncing ${this.syncQueue.length} queued operations to Redis...`);
        
        const pipeline = client.pipeline();
        for (const { key, value, expiry } of this.syncQueue) {
          const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
          
          if (expiry) {
            pipeline.setex(key, expiry, serializedValue);
          } else {
            pipeline.set(key, serializedValue);
          }
        }

        await pipeline.exec();
        this.syncQueue = [];
      }

      // Sync existing fallback data if in persistent mode
      if (this.options.persistentFallback) {
        const pipeline = client.pipeline();
        let syncCount = 0;

        for (const [key, data] of Object.entries(this.fallbackData)) {
          // Skip expired data
          if (data.expiry && data.expiry < Date.now()) {
            continue;
          }

          const serializedValue = typeof data.value === 'string' ? data.value : JSON.stringify(data.value);
          const ttl = data.expiry ? Math.ceil((data.expiry - Date.now()) / 1000) : undefined;

          if (ttl && ttl > 0) {
            pipeline.setex(key, ttl, serializedValue);
          } else {
            pipeline.set(key, serializedValue);
          }
          
          syncCount++;
        }

        if (syncCount > 0) {
          console.log(`Syncing ${syncCount} fallback keys to Redis...`);
          await pipeline.exec();
        }
      }

      this.stats.syncStatus = 'synced';
      this.stats.lastSyncTime = Date.now();
      this.stats.isUsingFallback = this.options.persistentFallback!;

      console.log('Fallback sync completed successfully');
    } catch (error) {
      console.error('Fallback sync failed:', error);
      this.stats.syncStatus = 'failed';
    }
  }

  /**
   * Check memory limits
   */
  private checkMemoryLimits(): boolean {
    if (!this.options.maxMemorySize) {
      return true;
    }

    this.updateStats();
    return this.stats.memoryUsage < this.options.maxMemorySize;
  }

  /**
   * Get fallback statistics
   */
  public getStats(): FallbackStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Clear fallback data
   */
  public clearFallbackData(): void {
    this.fallbackData = {};
    this.syncQueue = [];
    this.updateStats();
    console.log('Fallback data cleared');
  }

  /**
   * Get all fallback keys
   */
  public getFallbackKeys(): string[] {
    return Object.keys(this.fallbackData);
  }

  /**
   * Export fallback data
   */
  public exportFallbackData(): FallbackData {
    return { ...this.fallbackData };
  }

  /**
   * Import fallback data
   */
  public importFallbackData(data: FallbackData): void {
    this.fallbackData = { ...data };
    this.updateStats();
    console.log(`Imported ${Object.keys(data).length} fallback entries`);
  }

  /**
   * Force fallback mode
   */
  public forceFallbackMode(enabled: boolean): void {
    this.options.persistentFallback = enabled;
    this.stats.isUsingFallback = enabled;
    console.log(`Fallback mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Subscribe to fallback events
   */
  public on(event: 'fallback:activated' | 'redis:connected' | 'redis:disconnected', listener: () => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Remove event listener
   */
  public off(event: 'fallback:activated' | 'redis:connected' | 'redis:disconnected', listener: () => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Shutdown fallback manager
   */
  public async shutdown(): Promise<void> {
    // Final sync if possible
    if (this.options.enableAutoSync && isRedisAvailable()) {
      try {
        await this.syncWithRedis();
      } catch (error) {
        console.warn('Final sync failed:', error);
      }
    }

    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Clear data
    this.fallbackData = {};
    this.syncQueue = [];
    this.eventEmitter.removeAllListeners();

    console.log('Fallback manager shut down');
  }
}

// Export singleton instance
export const fallbackManager = FallbackManager.getInstance();

// Utility class for common fallback patterns
export class FallbackCache {
  /**
   * Get or set with fallback
   */
  static async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    ttlSeconds?: number
  ): Promise<T> {
    // Try to get existing value
    const existing = await fallbackManager.get<T>(key);
    if (existing !== null) {
      return existing;
    }

    // Generate new value
    const value = await factory();
    
    // Store with fallback
    await fallbackManager.set(key, value, ttlSeconds);
    
    return value;
  }

  /**
   * Cache function result with fallback
   */
  static memoize<Args extends any[], Return>(
    fn: (...args: Args) => Promise<Return> | Return,
    options: {
      keyGenerator?: (...args: Args) => string;
      ttl?: number;
    } = {}
  ): (...args: Args) => Promise<Return> {
    const { keyGenerator = (...args) => JSON.stringify(args), ttl } = options;

    return async (...args: Args): Promise<Return> => {
      const key = `memoized:${keyGenerator(...args)}`;
      return FallbackCache.getOrSet(key, () => fn(...args), ttl);
    };
  }
}

// Export types
export type { FallbackOptions, FallbackStats, FallbackData };

// Export utilities
export const getFallbackStats = () => fallbackManager.getStats();
export const syncWithRedis = () => fallbackManager.syncWithRedis();
export const clearFallback = () => fallbackManager.clearFallbackData();

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => fallbackManager.shutdown());
  process.on('SIGINT', () => fallbackManager.shutdown());
}

export default fallbackManager;