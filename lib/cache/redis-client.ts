/**
 * Redis Client with Connection Pooling and Retry Logic
 * Provides robust Redis connection with automatic reconnection and failover
 */

import Redis, { RedisOptions } from 'ioredis';
import { appConfig } from '@/lib/config/app-config';

export interface RedisClientConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix?: string;
  connectionTimeout: number;
  commandTimeout: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  enableAutoPipelining: boolean;
  maxMemoryPolicy?: string;
}

export interface RedisConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastError?: Error;
  connectionAttempts: number;
  lastConnectedAt?: Date;
  lastReconnectAt?: Date;
}

/**
 * Enhanced Redis client with connection management
 */
class RedisClient {
  private static instance: RedisClient;
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private publisher: Redis | null = null;
  private config: RedisClientConfig;
  private connectionState: RedisConnectionState = {
    isConnected: false,
    isConnecting: false,
    connectionAttempts: 0,
  };
  private healthCheckInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;

  private constructor() {
    this.config = this.loadConfig();
    this.setupClient();
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private loadConfig(): RedisClientConfig {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'ai-chatbot:',
      connectionTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '10000'),
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      lazyConnect: process.env.REDIS_LAZY_CONNECT !== 'false',
      enableAutoPipelining: process.env.REDIS_AUTO_PIPELINE !== 'false',
      maxMemoryPolicy: process.env.REDIS_MAXMEMORY_POLICY,
    };
  }

  private getRedisOptions(): RedisOptions {
    return {
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix,
      connectTimeout: this.config.connectionTimeout,
      commandTimeout: this.config.commandTimeout,
      retryDelayOnFailover: this.config.retryDelayOnFailover,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest,
      lazyConnect: this.config.lazyConnect,
      enableAutoPipelining: this.config.enableAutoPipelining,
      
      // Connection pool settings
      family: 4,
      keepAlive: true,
      
      // Retry logic
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      
      // Reconnect on error
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      },
    };
  }

  private setupClient(): void {
    try {
      this.client = new Redis(this.getRedisOptions());
      this.setupEventHandlers(this.client);
      this.startHealthCheck();
    } catch (error) {
      console.error('Failed to create Redis client:', error);
      this.connectionState.lastError = error as Error;
    }
  }

  private setupEventHandlers(client: Redis): void {
    client.on('connect', () => {
      console.log('Redis connected');
      this.connectionState.isConnected = true;
      this.connectionState.isConnecting = false;
      this.connectionState.lastConnectedAt = new Date();
      this.connectionState.connectionAttempts = 0;
      this.connectionState.lastError = undefined;
    });

    client.on('ready', () => {
      console.log('Redis ready');
      this.applyRedisConfig();
    });

    client.on('error', (error: Error) => {
      console.error('Redis error:', error);
      this.connectionState.lastError = error;
      this.connectionState.isConnected = false;
      this.scheduleReconnect();
    });

    client.on('close', () => {
      console.log('Redis connection closed');
      this.connectionState.isConnected = false;
    });

    client.on('reconnecting', (ms: number) => {
      console.log(`Redis reconnecting in ${ms}ms`);
      this.connectionState.isConnecting = true;
      this.connectionState.connectionAttempts++;
      this.connectionState.lastReconnectAt = new Date();
    });

    client.on('end', () => {
      console.log('Redis connection ended');
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
    });
  }

  private async applyRedisConfig(): Promise<void> {
    if (!this.client) return;

    try {
      // Apply maxmemory policy if specified
      if (this.config.maxMemoryPolicy) {
        await this.client.config('SET', 'maxmemory-policy', this.config.maxMemoryPolicy);
      }
      
      // Set other Redis configurations as needed
      // await this.client.config('SET', 'timeout', '300');
      
    } catch (error) {
      console.error('Failed to apply Redis config:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Exponential backoff for reconnection
    const delay = Math.min(1000 * Math.pow(2, this.connectionState.connectionAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      if (!this.connectionState.isConnected && !this.connectionState.isConnecting) {
        console.log('Attempting Redis reconnection...');
        this.setupClient();
      }
    }, delay);
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        if (this.client && this.connectionState.isConnected) {
          await this.client.ping();
        }
      } catch (error) {
        console.error('Redis health check failed:', error);
        this.connectionState.isConnected = false;
        this.connectionState.lastError = error as Error;
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get the main Redis client
   */
  public getClient(): Redis | null {
    return this.client;
  }

  /**
   * Get Redis client for pub/sub subscriber
   */
  public getSubscriber(): Redis {
    if (!this.subscriber) {
      this.subscriber = new Redis(this.getRedisOptions());
      this.setupEventHandlers(this.subscriber);
    }
    return this.subscriber;
  }

  /**
   * Get Redis client for pub/sub publisher
   */
  public getPublisher(): Redis {
    if (!this.publisher) {
      this.publisher = new Redis(this.getRedisOptions());
      this.setupEventHandlers(this.publisher);
    }
    return this.publisher;
  }

  /**
   * Check if Redis is available
   */
  public isAvailable(): boolean {
    return this.connectionState.isConnected && this.client !== null;
  }

  /**
   * Get connection state
   */
  public getConnectionState(): RedisConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Force reconnection
   */
  public async reconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
    }
    
    this.connectionState.isConnected = false;
    this.connectionState.isConnecting = false;
    this.setupClient();
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    details: {
      connected: boolean;
      latency?: number;
      memory?: string;
      version?: string;
      uptime?: number;
      keyspace?: Record<string, any>;
    };
  }> {
    try {
      if (!this.isAvailable()) {
        return {
          status: 'unhealthy',
          details: {
            connected: false,
          },
        };
      }

      const start = Date.now();
      await this.client!.ping();
      const latency = Date.now() - start;

      // Get Redis info
      const info = await this.client!.info();
      const infoLines = info.split('\r\n');
      const infoData: Record<string, string> = {};
      
      infoLines.forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            infoData[key] = value;
          }
        }
      });

      return {
        status: latency < 100 ? 'healthy' : 'degraded',
        details: {
          connected: true,
          latency,
          memory: infoData.used_memory_human,
          version: infoData.redis_version,
          uptime: parseInt(infoData.uptime_in_seconds || '0'),
          keyspace: {
            db0: infoData.db0,
          },
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
        },
      };
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down Redis clients...');

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Disconnect clients
    const disconnectPromises = [];
    
    if (this.client) {
      disconnectPromises.push(this.client.quit());
    }
    
    if (this.subscriber) {
      disconnectPromises.push(this.subscriber.quit());
    }
    
    if (this.publisher) {
      disconnectPromises.push(this.publisher.quit());
    }

    try {
      await Promise.all(disconnectPromises);
      console.log('Redis clients shut down gracefully');
    } catch (error) {
      console.error('Error during Redis shutdown:', error);
    }
  }

  /**
   * Execute command with automatic retry and fallback
   */
  public async execute<T = any>(
    command: string,
    ...args: any[]
  ): Promise<T | null> {
    if (!this.isAvailable()) {
      console.warn('Redis not available, returning null');
      return null;
    }

    try {
      const result = await (this.client! as any)[command](...args);
      return result;
    } catch (error) {
      console.error(`Redis command ${command} failed:`, error);
      
      // Update connection state
      this.connectionState.lastError = error as Error;
      this.connectionState.isConnected = false;
      
      return null;
    }
  }

  /**
   * Batch operations with pipeline
   */
  public async pipeline(operations: Array<{ command: string; args: any[] }>): Promise<any[]> {
    if (!this.isAvailable()) {
      console.warn('Redis not available for pipeline operations');
      return [];
    }

    try {
      const pipeline = this.client!.pipeline();
      
      operations.forEach(({ command, args }) => {
        (pipeline as any)[command](...args);
      });
      
      const results = await pipeline.exec();
      return results?.map(([err, result]) => err ? null : result) || [];
    } catch (error) {
      console.error('Redis pipeline failed:', error);
      return [];
    }
  }
}

// Export singleton instance
export const redisClient = RedisClient.getInstance();

// Export types
export type { RedisConnectionState };

// Export utilities
export const isRedisAvailable = () => redisClient.isAvailable();
export const getRedisHealth = () => redisClient.healthCheck();

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => redisClient.shutdown());
  process.on('SIGINT', () => redisClient.shutdown());
}

export default redisClient;