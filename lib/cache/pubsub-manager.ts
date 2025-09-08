/**
 * Pub/Sub Manager with Redis Backend and Memory Fallback
 * Handles real-time messaging, notifications, and event broadcasting
 */

import { redisClient, isRedisAvailable } from './redis-client';
import { EventEmitter } from 'events';

export interface PubSubMessage<T = any> {
  id: string;
  channel: string;
  data: T;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface PubSubOptions {
  pattern?: boolean; // Use pattern matching for channels
  buffer?: boolean; // Buffer messages when Redis unavailable
  maxBuffer?: number; // Maximum buffered messages
  persistent?: boolean; // Store messages in Redis for reliability
  ttl?: number; // Message TTL in seconds
}

export interface ChannelStats {
  channel: string;
  subscribers: number;
  messagesPublished: number;
  messagesReceived: number;
  backend: 'redis' | 'memory';
}

export type MessageHandler<T = any> = (message: PubSubMessage<T>) => Promise<void> | void;

/**
 * Pub/Sub manager with Redis and EventEmitter fallback
 */
class PubSubManager {
  private static instance: PubSubManager;
  private eventEmitter = new EventEmitter();
  private redisSubscriber?: ReturnType<typeof redisClient.getSubscriber>;
  private redisPublisher?: ReturnType<typeof redisClient.getPublisher>;
  private subscriptions = new Map<string, Set<MessageHandler>>();
  private messageBuffer = new Map<string, PubSubMessage[]>();
  private stats = new Map<string, ChannelStats>();
  private maxBufferSize = 100;

  private constructor() {
    this.setupRedisSubscriber();
    this.eventEmitter.setMaxListeners(1000); // Support many channels
  }

  public static getInstance(): PubSubManager {
    if (!PubSubManager.instance) {
      PubSubManager.instance = new PubSubManager();
    }
    return PubSubManager.instance;
  }

  private setupRedisSubscriber(): void {
    if (!isRedisAvailable()) {
      return;
    }

    try {
      this.redisSubscriber = redisClient.getSubscriber();
      this.redisPublisher = redisClient.getPublisher();

      this.redisSubscriber.on('message', (channel: string, message: string) => {
        this.handleRedisMessage(channel, message, false);
      });

      this.redisSubscriber.on('pmessage', (pattern: string, channel: string, message: string) => {
        this.handleRedisMessage(channel, message, true);
      });

      this.redisSubscriber.on('error', (error: Error) => {
        console.error('Redis subscriber error:', error);
      });

      this.redisSubscriber.on('connect', () => {
        console.log('Redis subscriber connected');
        this.flushMessageBuffer();
      });

    } catch (error) {
      console.error('Failed to setup Redis subscriber:', error);
    }
  }

  private handleRedisMessage(channel: string, message: string, fromPattern: boolean): void {
    try {
      const pubSubMessage: PubSubMessage = JSON.parse(message);
      this.deliverMessage(channel, pubSubMessage);
      this.updateStats(channel, 'received');
    } catch (error) {
      console.error('Failed to parse Redis message:', error);
    }
  }

  private deliverMessage(channel: string, message: PubSubMessage): void {
    const handlers = this.subscriptions.get(channel);
    if (handlers) {
      handlers.forEach(async (handler) => {
        try {
          await handler(message);
        } catch (error) {
          console.error(`Error in message handler for channel ${channel}:`, error);
        }
      });
    }

    // Also emit to EventEmitter for local subscribers
    this.eventEmitter.emit(channel, message);
  }

  private updateStats(channel: string, type: 'published' | 'received'): void {
    let stats = this.stats.get(channel);
    if (!stats) {
      stats = {
        channel,
        subscribers: 0,
        messagesPublished: 0,
        messagesReceived: 0,
        backend: isRedisAvailable() ? 'redis' : 'memory',
      };
      this.stats.set(channel, stats);
    }

    if (type === 'published') {
      stats.messagesPublished++;
    } else {
      stats.messagesReceived++;
    }
  }

  private flushMessageBuffer(): void {
    if (!isRedisAvailable()) {
      return;
    }

    for (const [channel, messages] of this.messageBuffer.entries()) {
      for (const message of messages) {
        this.publishToRedis(channel, message).catch(console.error);
      }
    }

    this.messageBuffer.clear();
  }

  private async publishToRedis(channel: string, message: PubSubMessage): Promise<boolean> {
    if (!this.redisPublisher) {
      return false;
    }

    try {
      const serialized = JSON.stringify(message);
      const result = await this.redisPublisher.publish(channel, serialized);
      return result > 0;
    } catch (error) {
      console.error('Redis publish error:', error);
      return false;
    }
  }

  private bufferMessage(channel: string, message: PubSubMessage): void {
    let buffer = this.messageBuffer.get(channel);
    if (!buffer) {
      buffer = [];
      this.messageBuffer.set(channel, buffer);
    }

    buffer.push(message);

    // Limit buffer size
    if (buffer.length > this.maxBufferSize) {
      buffer.shift(); // Remove oldest message
    }
  }

  /**
   * Subscribe to a channel
   */
  public async subscribe<T = any>(
    channel: string,
    handler: MessageHandler<T>,
    options: PubSubOptions = {}
  ): Promise<void> {
    // Add to local subscriptions
    let handlers = this.subscriptions.get(channel);
    if (!handlers) {
      handlers = new Set();
      this.subscriptions.set(channel, handlers);
    }
    handlers.add(handler as MessageHandler);

    // Subscribe to Redis if available
    if (isRedisAvailable() && this.redisSubscriber) {
      try {
        if (options.pattern) {
          await this.redisSubscriber.psubscribe(channel);
        } else {
          await this.redisSubscriber.subscribe(channel);
        }
      } catch (error) {
        console.warn('Redis subscription failed, using memory fallback:', error);
      }
    }

    // Update stats
    const stats = this.stats.get(channel);
    if (stats) {
      stats.subscribers = handlers.size;
    } else {
      this.stats.set(channel, {
        channel,
        subscribers: handlers.size,
        messagesPublished: 0,
        messagesReceived: 0,
        backend: isRedisAvailable() ? 'redis' : 'memory',
      });
    }

    console.log(`Subscribed to channel: ${channel} (${handlers.size} subscribers)`);
  }

  /**
   * Unsubscribe from a channel
   */
  public async unsubscribe(
    channel: string,
    handler?: MessageHandler
  ): Promise<void> {
    const handlers = this.subscriptions.get(channel);
    if (!handlers) {
      return;
    }

    if (handler) {
      // Remove specific handler
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
      }
    } else {
      // Remove all handlers
      handlers.clear();
      this.subscriptions.delete(channel);
    }

    // Unsubscribe from Redis if no more handlers
    if (handlers.size === 0 && isRedisAvailable() && this.redisSubscriber) {
      try {
        await this.redisSubscriber.unsubscribe(channel);
      } catch (error) {
        console.warn('Redis unsubscribe failed:', error);
      }
    }

    // Update stats
    const stats = this.stats.get(channel);
    if (stats) {
      stats.subscribers = handlers.size;
    }

    console.log(`Unsubscribed from channel: ${channel} (${handlers.size} subscribers)`);
  }

  /**
   * Publish message to a channel
   */
  public async publish<T = any>(
    channel: string,
    data: T,
    options: {
      userId?: string;
      sessionId?: string;
      metadata?: Record<string, any>;
      persistent?: boolean;
      ttl?: number;
    } = {}
  ): Promise<boolean> {
    const message: PubSubMessage<T> = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channel,
      data,
      timestamp: Date.now(),
      userId: options.userId,
      sessionId: options.sessionId,
      metadata: options.metadata,
    };

    let published = false;

    // Publish to Redis if available
    if (isRedisAvailable()) {
      try {
        published = await this.publishToRedis(channel, message);
        
        // Store persistent messages in Redis
        if (options.persistent && this.redisPublisher) {
          const key = `persistent_msg:${channel}:${message.id}`;
          const ttl = options.ttl || 3600; // 1 hour default
          await this.redisPublisher.setex(key, ttl, JSON.stringify(message));
        }
      } catch (error) {
        console.warn('Redis publish failed, using memory fallback:', error);
      }
    }

    if (!published) {
      // Fallback to memory/EventEmitter
      this.deliverMessage(channel, message);
      
      // Buffer message if Redis becomes available later
      if (options.persistent !== false) {
        this.bufferMessage(channel, message);
      }
      
      published = true;
    }

    this.updateStats(channel, 'published');
    return published;
  }

  /**
   * Get persistent messages from a channel
   */
  public async getPersistentMessages(
    channel: string,
    limit: number = 50
  ): Promise<PubSubMessage[]> {
    if (!isRedisAvailable() || !this.redisPublisher) {
      return [];
    }

    try {
      const pattern = `persistent_msg:${channel}:*`;
      const keys = await this.redisPublisher.keys(pattern);
      
      if (keys.length === 0) {
        return [];
      }

      // Get messages
      const messages: PubSubMessage[] = [];
      const pipeline = this.redisPublisher.pipeline();
      
      keys.forEach(key => pipeline.get(key));
      const results = await pipeline.exec();
      
      if (results) {
        for (const [err, result] of results) {
          if (!err && result) {
            try {
              const message: PubSubMessage = JSON.parse(result as string);
              messages.push(message);
            } catch (parseError) {
              console.warn('Failed to parse persistent message:', parseError);
            }
          }
        }
      }

      // Sort by timestamp and limit
      return messages
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to get persistent messages:', error);
      return [];
    }
  }

  /**
   * Get channel statistics
   */
  public getChannelStats(channel?: string): ChannelStats[] {
    if (channel) {
      const stats = this.stats.get(channel);
      return stats ? [stats] : [];
    }

    return Array.from(this.stats.values());
  }

  /**
   * Get list of active channels
   */
  public getActiveChannels(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Get subscriber count for a channel
   */
  public getSubscriberCount(channel: string): number {
    const handlers = this.subscriptions.get(channel);
    return handlers ? handlers.size : 0;
  }

  /**
   * Clear all subscriptions
   */
  public async clearSubscriptions(): Promise<void> {
    // Clear local subscriptions
    this.subscriptions.clear();

    // Unsubscribe from all Redis channels
    if (isRedisAvailable() && this.redisSubscriber) {
      try {
        await this.redisSubscriber.unsubscribe();
        await this.redisSubscriber.punsubscribe();
      } catch (error) {
        console.warn('Failed to clear Redis subscriptions:', error);
      }
    }

    // Clear stats
    this.stats.clear();
  }

  /**
   * Shutdown pub/sub manager
   */
  public async shutdown(): Promise<void> {
    await this.clearSubscriptions();
    this.messageBuffer.clear();
    this.eventEmitter.removeAllListeners();
    
    // Disconnect Redis clients
    try {
      if (this.redisSubscriber) {
        await this.redisSubscriber.quit();
      }
      if (this.redisPublisher) {
        await this.redisPublisher.quit();
      }
    } catch (error) {
      console.warn('Error shutting down Redis pub/sub clients:', error);
    }
  }
}

// Export singleton instance
export const pubSubManager = PubSubManager.getInstance();

// Real-time feature helpers
export class RealTimeManager {
  /**
   * Broadcast AI response to all listeners
   */
  static async broadcastAIResponse(
    conversationId: string,
    response: any,
    userId?: string
  ): Promise<void> {
    await pubSubManager.publish(`ai:response:${conversationId}`, {
      type: 'ai_response',
      conversationId,
      response,
      timestamp: Date.now(),
    }, { userId, persistent: true });
  }

  /**
   * Subscribe to AI responses for a conversation
   */
  static async subscribeToAIResponses(
    conversationId: string,
    handler: MessageHandler<{ type: string; conversationId: string; response: any }>
  ): Promise<void> {
    await pubSubManager.subscribe(`ai:response:${conversationId}`, handler);
  }

  /**
   * Broadcast typing indicator
   */
  static async broadcastTyping(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    await pubSubManager.publish(`typing:${conversationId}`, {
      type: 'typing',
      conversationId,
      userId,
      isTyping,
      timestamp: Date.now(),
    }, { userId });
  }

  /**
   * Subscribe to typing indicators
   */
  static async subscribeToTyping(
    conversationId: string,
    handler: MessageHandler<{ type: string; userId: string; isTyping: boolean }>
  ): Promise<void> {
    await pubSubManager.subscribe(`typing:${conversationId}`, handler);
  }

  /**
   * Broadcast user presence
   */
  static async broadcastPresence(
    userId: string,
    status: 'online' | 'offline' | 'away'
  ): Promise<void> {
    await pubSubManager.publish(`presence:${userId}`, {
      type: 'presence',
      userId,
      status,
      timestamp: Date.now(),
    }, { userId, persistent: true, ttl: 300 }); // 5 minutes
  }

  /**
   * Subscribe to user presence
   */
  static async subscribeToPresence(
    userId: string,
    handler: MessageHandler<{ type: string; userId: string; status: string }>
  ): Promise<void> {
    await pubSubManager.subscribe(`presence:${userId}`, handler);
  }

  /**
   * Broadcast notification
   */
  static async broadcastNotification(
    userId: string,
    notification: {
      id: string;
      title: string;
      message: string;
      type: string;
      data?: any;
    }
  ): Promise<void> {
    await pubSubManager.publish(`notifications:${userId}`, {
      type: 'notification',
      userId,
      notification,
      timestamp: Date.now(),
    }, { userId, persistent: true });
  }

  /**
   * Subscribe to user notifications
   */
  static async subscribeToNotifications(
    userId: string,
    handler: MessageHandler<{ type: string; notification: any }>
  ): Promise<void> {
    await pubSubManager.subscribe(`notifications:${userId}`, handler);
  }
}

// Export types
export type { PubSubMessage, PubSubOptions, ChannelStats, MessageHandler };

// Export utilities
export const subscribe = pubSubManager.subscribe.bind(pubSubManager);
export const unsubscribe = pubSubManager.unsubscribe.bind(pubSubManager);
export const publish = pubSubManager.publish.bind(pubSubManager);
export const getChannelStats = pubSubManager.getChannelStats.bind(pubSubManager);

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => pubSubManager.shutdown());
  process.on('SIGINT', () => pubSubManager.shutdown());
}

export default pubSubManager;