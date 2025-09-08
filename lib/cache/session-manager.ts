/**
 * Session Manager with Redis Backend and Memory Fallback
 * Handles guest user sessions and temporary data storage
 */

import { redisClient, isRedisAvailable } from './redis-client';
import { cacheManager } from './cache-manager';
import { nanoid } from 'nanoid';

export interface SessionData {
  id: string;
  userId?: string;
  isGuest: boolean;
  data: Record<string, any>;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionOptions {
  ttl?: number; // Session TTL in seconds
  sliding?: boolean; // Extend expiration on access
  prefix?: string; // Key prefix
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  guestSessions: number;
  authenticatedSessions: number;
  backend: 'redis' | 'memory' | 'hybrid';
}

/**
 * Session manager with Redis and memory fallback
 */
class SessionManager {
  private static instance: SessionManager;
  private memorySessions = new Map<string, SessionData>();
  private cleanupInterval?: NodeJS.Timeout;
  private defaultTTL = 24 * 60 * 60; // 24 hours
  private sessionPrefix = 'session';

  private constructor() {
    this.startCleanupInterval();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private startCleanupInterval(): void {
    // Clean expired sessions every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 10 * 60 * 1000);
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    
    // Cleanup memory sessions
    let cleanedMemory = 0;
    for (const [sessionId, session] of this.memorySessions.entries()) {
      if (session.expiresAt < now) {
        this.memorySessions.delete(sessionId);
        cleanedMemory++;
      }
    }

    // Cleanup Redis sessions (if available)
    let cleanedRedis = 0;
    if (isRedisAvailable()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const pattern = `${this.sessionPrefix}:*`;
          const keys = await client.keys(pattern);
          
          for (const key of keys) {
            const sessionData = await client.get(key);
            if (sessionData) {
              try {
                const session: SessionData = JSON.parse(sessionData);
                if (session.expiresAt < now) {
                  await client.del(key);
                  cleanedRedis++;
                }
              } catch (error) {
                // Invalid session data, delete it
                await client.del(key);
                cleanedRedis++;
              }
            }
          }
        }
      } catch (error) {
        console.warn('Redis session cleanup failed:', error);
      }
    }

    if (cleanedMemory + cleanedRedis > 0) {
      console.log(`Cleaned ${cleanedMemory} memory + ${cleanedRedis} Redis expired sessions`);
    }
  }

  private generateSessionKey(sessionId: string): string {
    return `${this.sessionPrefix}:${sessionId}`;
  }

  /**
   * Create a new session
   */
  public async createSession(
    userId?: string,
    initialData: Record<string, any> = {},
    options: SessionOptions = {}
  ): Promise<string> {
    const sessionId = nanoid();
    const ttl = options.ttl || this.defaultTTL;
    const now = Date.now();

    const session: SessionData = {
      id: sessionId,
      userId,
      isGuest: !userId,
      data: { ...initialData },
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + (ttl * 1000),
    };

    const sessionKey = this.generateSessionKey(sessionId);

    // Try to store in Redis first
    if (isRedisAvailable()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          await client.setex(sessionKey, ttl, JSON.stringify(session));
        }
      } catch (error) {
        console.warn('Redis session creation failed, using memory fallback:', error);
        this.memorySessions.set(sessionId, session);
      }
    } else {
      // Fallback to memory
      this.memorySessions.set(sessionId, session);
    }

    return sessionId;
  }

  /**
   * Get session by ID
   */
  public async getSession(sessionId: string, options: SessionOptions = {}): Promise<SessionData | null> {
    const sessionKey = this.generateSessionKey(sessionId);
    const now = Date.now();
    let session: SessionData | null = null;

    // Try Redis first
    if (isRedisAvailable()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const sessionData = await client.get(sessionKey);
          if (sessionData) {
            session = JSON.parse(sessionData);
          }
        }
      } catch (error) {
        console.warn('Redis session retrieval failed, trying memory:', error);
      }
    }

    // Fallback to memory
    if (!session) {
      session = this.memorySessions.get(sessionId) || null;
    }

    // Check if session exists and hasn't expired
    if (!session || session.expiresAt < now) {
      if (session) {
        await this.deleteSession(sessionId);
      }
      return null;
    }

    // Update last accessed time if sliding expiration is enabled
    if (options.sliding !== false) {
      session.lastAccessedAt = now;
      const ttl = options.ttl || this.defaultTTL;
      session.expiresAt = now + (ttl * 1000);
      
      // Update in storage
      await this.updateSession(sessionId, session.data, { ttl });
    }

    return session;
  }

  /**
   * Update session data
   */
  public async updateSession(
    sessionId: string,
    data: Record<string, any>,
    options: SessionOptions = {}
  ): Promise<boolean> {
    const session = await this.getSession(sessionId, { sliding: false });
    if (!session) {
      return false;
    }

    // Update session data
    session.data = { ...session.data, ...data };
    session.lastAccessedAt = Date.now();
    
    // Update expiration if new TTL provided
    if (options.ttl) {
      session.expiresAt = Date.now() + (options.ttl * 1000);
    }

    const sessionKey = this.generateSessionKey(sessionId);
    const ttl = Math.ceil((session.expiresAt - Date.now()) / 1000);

    // Update in Redis
    if (isRedisAvailable()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          await client.setex(sessionKey, ttl, JSON.stringify(session));
          // Remove from memory if it exists there
          this.memorySessions.delete(sessionId);
          return true;
        }
      } catch (error) {
        console.warn('Redis session update failed, using memory:', error);
      }
    }

    // Fallback to memory
    this.memorySessions.set(sessionId, session);
    return true;
  }

  /**
   * Delete session
   */
  public async deleteSession(sessionId: string): Promise<boolean> {
    const sessionKey = this.generateSessionKey(sessionId);
    let deleted = false;

    // Delete from Redis
    if (isRedisAvailable()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const result = await client.del(sessionKey);
          deleted = result > 0;
        }
      } catch (error) {
        console.warn('Redis session deletion failed:', error);
      }
    }

    // Delete from memory
    const hadMemory = this.memorySessions.has(sessionId);
    this.memorySessions.delete(sessionId);

    return deleted || hadMemory;
  }

  /**
   * Check if session exists
   */
  public async sessionExists(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId, { sliding: false });
    return session !== null;
  }

  /**
   * Get session data only
   */
  public async getSessionData(sessionId: string): Promise<Record<string, any> | null> {
    const session = await this.getSession(sessionId);
    return session?.data || null;
  }

  /**
   * Set session data
   */
  public async setSessionData(
    sessionId: string,
    key: string,
    value: any
  ): Promise<boolean> {
    return this.updateSession(sessionId, { [key]: value });
  }

  /**
   * Get session statistics
   */
  public async getStats(): Promise<SessionStats> {
    const stats: SessionStats = {
      totalSessions: 0,
      activeSessions: 0,
      guestSessions: 0,
      authenticatedSessions: 0,
      backend: 'hybrid',
    };

    const now = Date.now();

    // Count memory sessions
    for (const session of this.memorySessions.values()) {
      stats.totalSessions++;
      if (session.expiresAt > now) {
        stats.activeSessions++;
        if (session.isGuest) {
          stats.guestSessions++;
        } else {
          stats.authenticatedSessions++;
        }
      }
    }

    // Count Redis sessions
    if (isRedisAvailable()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const pattern = `${this.sessionPrefix}:*`;
          const keys = await client.keys(pattern);
          
          for (const key of keys) {
            const sessionData = await client.get(key);
            if (sessionData) {
              try {
                const session: SessionData = JSON.parse(sessionData);
                if (!this.memorySessions.has(session.id)) { // Avoid double counting
                  stats.totalSessions++;
                  if (session.expiresAt > now) {
                    stats.activeSessions++;
                    if (session.isGuest) {
                      stats.guestSessions++;
                    } else {
                      stats.authenticatedSessions++;
                    }
                  }
                }
              } catch (error) {
                // Invalid session data
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to get Redis session stats:', error);
      }
    }

    return stats;
  }

  /**
   * Get all active sessions for a user
   */
  public async getUserSessions(userId: string): Promise<SessionData[]> {
    const sessions: SessionData[] = [];
    const now = Date.now();

    // Check memory sessions
    for (const session of this.memorySessions.values()) {
      if (session.userId === userId && session.expiresAt > now) {
        sessions.push(session);
      }
    }

    // Check Redis sessions
    if (isRedisAvailable()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const pattern = `${this.sessionPrefix}:*`;
          const keys = await client.keys(pattern);
          
          for (const key of keys) {
            const sessionData = await client.get(key);
            if (sessionData) {
              try {
                const session: SessionData = JSON.parse(sessionData);
                if (session.userId === userId && 
                    session.expiresAt > now && 
                    !sessions.find(s => s.id === session.id)) {
                  sessions.push(session);
                }
              } catch (error) {
                // Invalid session data
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to get user sessions from Redis:', error);
      }
    }

    return sessions;
  }

  /**
   * Invalidate all sessions for a user
   */
  public async invalidateUserSessions(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId);
    let invalidated = 0;

    for (const session of sessions) {
      const success = await this.deleteSession(session.id);
      if (success) {
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Clear all sessions
   */
  public async clearAllSessions(): Promise<void> {
    // Clear memory sessions
    this.memorySessions.clear();

    // Clear Redis sessions
    if (isRedisAvailable()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          const pattern = `${this.sessionPrefix}:*`;
          const keys = await client.keys(pattern);
          if (keys.length > 0) {
            await client.del(...keys);
          }
        }
      } catch (error) {
        console.warn('Failed to clear Redis sessions:', error);
      }
    }
  }

  /**
   * Shutdown session manager
   */
  public async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    
    this.memorySessions.clear();
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Guest session helpers
export class GuestSessionManager {
  private static GUEST_PREFIX = 'guest';

  /**
   * Create guest session
   */
  static async createGuestSession(
    initialData: Record<string, any> = {},
    ttl: number = 24 * 60 * 60 // 24 hours
  ): Promise<string> {
    return sessionManager.createSession(undefined, {
      ...initialData,
      type: 'guest',
    }, { ttl, prefix: this.GUEST_PREFIX });
  }

  /**
   * Get guest session
   */
  static async getGuestSession(sessionId: string): Promise<SessionData | null> {
    const session = await sessionManager.getSession(sessionId);
    return session?.isGuest ? session : null;
  }

  /**
   * Update guest session
   */
  static async updateGuestSession(
    sessionId: string,
    data: Record<string, any>
  ): Promise<boolean> {
    const session = await sessionManager.getSession(sessionId, { sliding: false });
    if (!session?.isGuest) {
      return false;
    }
    return sessionManager.updateSession(sessionId, data);
  }

  /**
   * Convert guest session to authenticated
   */
  static async convertToAuthenticatedSession(
    sessionId: string,
    userId: string
  ): Promise<boolean> {
    const session = await sessionManager.getSession(sessionId, { sliding: false });
    if (!session?.isGuest) {
      return false;
    }

    // Create new authenticated session with existing data
    const newSessionId = await sessionManager.createSession(userId, session.data);
    
    // Delete old guest session
    await sessionManager.deleteSession(sessionId);
    
    return true;
  }
}

// Export types
export type { SessionData, SessionOptions, SessionStats };

// Export utilities
export const createGuestSession = (data?: Record<string, any>) => 
  GuestSessionManager.createGuestSession(data);
export const getGuestSession = (sessionId: string) => 
  GuestSessionManager.getGuestSession(sessionId);
export const getSessionStats = () => sessionManager.getStats();

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => sessionManager.shutdown());
  process.on('SIGINT', () => sessionManager.shutdown());
}

export default sessionManager;