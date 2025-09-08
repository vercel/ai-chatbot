/**
 * Cache Manager with Redis Backend and Memory Fallback
 * Handles AI response caching, session data, and general caching needs
 */

import { redisClient, isRedisAvailable } from './redis-client';
import { createHash } from 'crypto';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  compress?: boolean; // Compress large values
  fallbackToMemory?: boolean; // Use memory when Redis unavailable
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  backend: 'redis' | 'memory' | 'hybrid';
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
}

/**
 * Enhanced cache manager with Redis and memory fallback
 */
class CacheManager {
  private static instance: CacheManager;
  private memoryCache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    backend: 'hybrid',
  };
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    this.startCleanupInterval();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private startCleanupInterval(): void {
    // Clean expired memory cache entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanExpiredMemoryEntries();
    }, 5 * 60 * 1000);
  }

  private cleanExpiredMemoryEntries(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      const expiresAt = entry.timestamp + (entry.ttl * 1000);
      if (expiresAt < now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} expired cache entries from memory`);
    }
  }

  private generateKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || 'cache';
    return `${finalPrefix}:${key}`;
  }

  private createHash(data: string): string {
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private compress(data: string): string {
    // Simple compression for large data - in production, use zlib
    return data.length > 1000 ? JSON.stringify({ compressed: true, data }) : data;
  }

  private decompress(data: string): string {
    try {
      const parsed = JSON.parse(data);
      return parsed.compressed ? parsed.data : data;
    } catch {
      return data;
    }
  }

  /**
   * Get value from cache
   */
  public async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const finalKey = this.generateKey(key, options.prefix);

    // Try Redis first if available
    if (isRedisAvailable()) {
      try {
        const result = await this.getFromRedis<T>(finalKey, options);
        if (result !== null) {
          this.stats.hits++;
          return result;
        }
      } catch (error) {
        console.warn('Redis get failed, falling back to memory:', error);
        this.stats.errors++;
      }
    }

    // Fallback to memory cache
    if (options.fallbackToMemory !== false) {
      const result = this.getFromMemory<T>(finalKey);
      if (result !== null) {
        this.stats.hits++;
        return result;
      }
    }

    this.stats.misses++;
    return null;
  }

  private async getFromRedis<T>(key: string, options: CacheOptions): Promise<T | null> {
    const client = redisClient.getClient();
    if (!client) return null;

    const cached = await client.get(key);
    if (!cached) return null;

    try {
      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if expired (redundant with Redis TTL, but defensive)
      const now = Date.now();
      const expiresAt = entry.timestamp + (entry.ttl * 1000);
      if (expiresAt < now) {
        await client.del(key);
        return null;
      }

      // Decompress if needed
      let data = entry.data;
      if (entry.compressed && typeof data === 'string') {
        data = JSON.parse(this.decompress(data));
      }

      return data;
    } catch (error) {
      console.error('Failed to parse cached data:', error);
      await client.del(key);
      return null;
    }
  }

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const expiresAt = entry.timestamp + (entry.ttl * 1000);
    
    if (expiresAt < now) {
      this.memoryCache.delete(key);
      return null;
    }

    // Decompress if needed
    let data = entry.data;
    if (entry.compressed && typeof data === 'string') {
      data = JSON.parse(this.decompress(data));
    }

    return data;
  }

  /**
   * Set value in cache
   */
  public async set<T = any>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    const finalKey = this.generateKey(key, options.prefix);
    const ttl = options.ttl || 3600; // Default 1 hour
    const timestamp = Date.now();

    // Prepare cache entry
    let data: any = value;
    let compressed = false;

    // Compress large objects if enabled
    if (options.compress !== false && typeof value === 'object') {
      const serialized = JSON.stringify(value);
      if (serialized.length > 1000) {
        data = this.compress(serialized);
        compressed = true;
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp,
      ttl,
      compressed,
    };

    let success = false;

    // Try Redis first if available
    if (isRedisAvailable()) {
      try {
        success = await this.setToRedis(finalKey, entry, ttl);
        if (success) {
          this.stats.sets++;
        }
      } catch (error) {
        console.warn('Redis set failed, falling back to memory:', error);
        this.stats.errors++;
      }
    }

    // Fallback to memory cache
    if (!success && options.fallbackToMemory !== false) {
      this.setToMemory(finalKey, entry);
      this.stats.sets++;
      success = true;
    }

    return success;
  }

  private async setToRedis<T>(key: string, entry: CacheEntry<T>, ttl: number): Promise<boolean> {
    const client = redisClient.getClient();
    if (!client) return false;

    try {
      const serialized = JSON.stringify(entry);
      const result = await client.setex(key, ttl, serialized);
      return result === 'OK';
    } catch (error) {
      console.error('Failed to set Redis cache:', error);
      return false;
    }
  }

  private setToMemory<T>(key: string, entry: CacheEntry<T>): void {
    this.memoryCache.set(key, entry);
  }

  /**
   * Delete value from cache
   */
  public async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    const finalKey = this.generateKey(key, options.prefix);
    let success = false;

    // Delete from Redis
    if (isRedisAvailable()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const result = await client.del(finalKey);
          success = result > 0;
        }
      } catch (error) {
        console.warn('Redis delete failed:', error);
        this.stats.errors++;
      }
    }

    // Delete from memory cache
    const hadMemoryEntry = this.memoryCache.has(finalKey);
    this.memoryCache.delete(finalKey);
    
    if (success || hadMemoryEntry) {
      this.stats.deletes++;
      return true;
    }

    return false;
  }

  /**
   * Check if key exists in cache
   */
  public async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const finalKey = this.generateKey(key, options.prefix);

    // Check Redis first
    if (isRedisAvailable()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const exists = await client.exists(finalKey);
          return exists === 1;
        }
      } catch (error) {
        console.warn('Redis exists check failed:', error);
      }
    }

    // Check memory cache
    const entry = this.memoryCache.get(finalKey);
    if (entry) {
      const now = Date.now();
      const expiresAt = entry.timestamp + (entry.ttl * 1000);
      if (expiresAt >= now) {
        return true;
      } else {
        this.memoryCache.delete(finalKey);
      }
    }

    return false;
  }

  /**
   * Get or set value (cache-aside pattern)
   */
  public async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Generate new value
    const value = await factory();
    
    // Cache the new value
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * Clear all cache entries
   */
  public async clear(prefix?: string): Promise<void> {
    // Clear Redis
    if (isRedisAvailable()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          if (prefix) {
            const pattern = this.generateKey('*', prefix);
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
              await client.del(...keys);
            }
          } else {
            await client.flushdb();
          }
        }
      } catch (error) {
        console.warn('Redis clear failed:', error);
      }
    }

    // Clear memory cache
    if (prefix) {
      const prefixPattern = this.generateKey('', prefix);
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(prefixPattern)) {
          this.memoryCache.delete(key);
        }
      }
    } else {
      this.memoryCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      backend: this.stats.backend,
    };
  }

  /**
   * Get cache info
   */
  public async getInfo(): Promise<{
    redis: {
      available: boolean;
      stats?: any;
    };
    memory: {
      entries: number;
      size: number;
    };
    stats: CacheStats;
  }> {
    const info = {
      redis: {
        available: isRedisAvailable(),
        stats: undefined as any,
      },
      memory: {
        entries: this.memoryCache.size,
        size: JSON.stringify(Array.from(this.memoryCache.entries())).length,
      },
      stats: this.getStats(),
    };

    if (isRedisAvailable()) {
      try {
        info.redis.stats = await redisClient.healthCheck();
      } catch (error) {
        console.warn('Failed to get Redis stats:', error);
      }
    }

    return info;
  }

  /**
   * Shutdown cache manager
   */
  public async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    
    this.memoryCache.clear();
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// AI-specific cache helpers
export class AICacheManager {
  private static PREFIX = 'ai';
  private static DEFAULT_TTL = 24 * 60 * 60; // 24 hours

  /**
   * Cache AI response
   */
  static async cacheResponse(
    prompt: string,
    response: any,
    model: string,
    ttl: number = this.DEFAULT_TTL
  ): Promise<boolean> {
    const key = this.generateResponseKey(prompt, model);
    return cacheManager.set(key, {
      response,
      model,
      timestamp: Date.now(),
    }, {
      ttl,
      prefix: this.PREFIX,
      compress: true,
    });
  }

  /**
   * Get cached AI response
   */
  static async getCachedResponse(
    prompt: string,
    model: string
  ): Promise<any | null> {
    const key = this.generateResponseKey(prompt, model);
    const cached = await cacheManager.get(key, { prefix: this.PREFIX });
    return cached?.response || null;
  }

  /**
   * Cache conversation context
   */
  static async cacheConversation(
    conversationId: string,
    context: any,
    ttl: number = this.DEFAULT_TTL
  ): Promise<boolean> {
    const key = `conversation:${conversationId}`;
    return cacheManager.set(key, context, {
      ttl,
      prefix: this.PREFIX,
      compress: true,
    });
  }

  /**
   * Get cached conversation context
   */
  static async getCachedConversation(conversationId: string): Promise<any | null> {
    const key = `conversation:${conversationId}`;
    return cacheManager.get(key, { prefix: this.PREFIX });
  }

  /**
   * Clear AI cache
   */
  static async clearCache(): Promise<void> {
    return cacheManager.clear(this.PREFIX);
  }

  private static generateResponseKey(prompt: string, model: string): string {
    const hash = createHash('sha256').update(`${prompt}:${model}`).digest('hex');
    return `response:${hash}`;
  }
}

// Export types
export type { CacheOptions, CacheStats, CacheEntry };

// Export utilities
export const clearAllCache = () => cacheManager.clear();
export const getCacheStats = () => cacheManager.getStats();
export const getCacheInfo = () => cacheManager.getInfo();

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => cacheManager.shutdown());
  process.on('SIGINT', () => cacheManager.shutdown());
}

export default cacheManager;