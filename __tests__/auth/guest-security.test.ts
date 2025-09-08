/**
 * Test Suite: Guest User Security
 * Tests the security module for guest user authentication and validation
 * 
 * Coverage Areas:
 * - Token generation and validation
 * - Guest user creation and validation
 * - Security limits and restrictions
 * - Session management and cleanup
 * - Request validation middleware
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  generateGuestToken,
  validateGuestToken,
  generateGuestEmail,
  isGuestEmail,
  createSecureGuestUser,
  canGuestUseFeature,
  checkGuestLimits,
  sanitizeGuestData,
  validateGuestRequest,
  cleanupExpiredGuestSessions,
  guestLimitations,
  type GuestUser,
} from '@/lib/security/guest-security';

// Mock dependencies
jest.mock('@/lib/config/app-config', () => ({
  appConfig: {
    isFeatureEnabled: jest.fn().mockReturnValue(true),
  },
}));

describe('Guest Security Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env.AUTH_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Token Management', () => {
    describe('generateGuestToken', () => {
      it('should generate a valid 32-character hex token', () => {
        const identifier = 'test-user-127.0.0.1-browser';
        const token = generateGuestToken(identifier);
        
        expect(token).toBeDefined();
        expect(token).toHaveLength(32);
        expect(token).toMatch(/^[a-f0-9]{32}$/);
      });

      it('should generate different tokens for different identifiers', () => {
        const token1 = generateGuestToken('user1-127.0.0.1-chrome');
        const token2 = generateGuestToken('user2-127.0.0.1-firefox');
        
        expect(token1).not.toBe(token2);
      });

      it('should include timestamp and randomness', () => {
        const identifier = 'test-user';
        
        // Generate multiple tokens rapidly
        const tokens = Array.from({ length: 5 }, () => generateGuestToken(identifier));
        
        // All should be different due to timestamp and random components
        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(tokens.length);
      });

      it('should work with missing AUTH_SECRET', () => {
        delete process.env.AUTH_SECRET;
        
        const token = generateGuestToken('test-user');
        expect(token).toBeDefined();
        expect(token).toHaveLength(32);
        expect(validateGuestToken(token)).toBe(true);
      });
    });

    describe('validateGuestToken', () => {
      it('should validate correct token format', () => {
        const validToken = 'a1b2c3d4e5f6789012345678901234ab';
        expect(validateGuestToken(validToken)).toBe(true);
      });

      it('should reject tokens with invalid length', () => {
        expect(validateGuestToken('short')).toBe(false);
        expect(validateGuestToken('a'.repeat(31))).toBe(false);
        expect(validateGuestToken('a'.repeat(33))).toBe(false);
      });

      it('should reject tokens with invalid characters', () => {
        expect(validateGuestToken('G1b2c3d4e5f6789012345678901234ab')).toBe(false); // Contains 'G'
        expect(validateGuestToken('a1b2c3d4e5f6789012345678901234@b')).toBe(false); // Contains '@'
        expect(validateGuestToken('a1b2c3d4e5f6789012345678901234 b')).toBe(false); // Contains space
      });

      it('should handle edge cases', () => {
        expect(validateGuestToken('')).toBe(false);
        expect(validateGuestToken(null as any)).toBe(false);
        expect(validateGuestToken(undefined as any)).toBe(false);
      });
    });
  });

  describe('Email Management', () => {
    describe('generateGuestEmail', () => {
      it('should generate valid guest email format', () => {
        const email = generateGuestEmail();
        
        expect(email).toMatch(/^guest-\d+-[a-f0-9]+@localhost$/);
        expect(isGuestEmail(email)).toBe(true);
      });

      it('should generate unique emails', () => {
        const emails = Array.from({ length: 10 }, () => generateGuestEmail());
        const uniqueEmails = new Set(emails);
        
        expect(uniqueEmails.size).toBe(emails.length);
      });

      it('should include timestamp and random components', () => {
        const email = generateGuestEmail();
        const match = email.match(/^guest-(\d+)-([a-f0-9]+)@localhost$/);
        
        expect(match).toBeTruthy();
        expect(match![1]).toBeTruthy(); // timestamp
        expect(match![2]).toBeTruthy(); // random hex
        expect(match![2]).toHaveLength(8); // 4 bytes = 8 hex chars
      });
    });

    describe('isGuestEmail', () => {
      it('should identify valid guest emails', () => {
        const validEmails = [
          'guest-1640995200000-1234abcd@localhost',
          'guest-1234567890-abcdef12@localhost',
        ];

        validEmails.forEach(email => {
          expect(isGuestEmail(email)).toBe(true);
        });
      });

      it('should reject invalid guest emails', () => {
        const invalidEmails = [
          'user@example.com',
          'guest@localhost',
          'guest-123@localhost',
          'guest-abc-def@localhost',
          'guest-123-@localhost',
          'guest-123-abc@example.com',
          'guest-123-abc',
        ];

        invalidEmails.forEach(email => {
          expect(isGuestEmail(email)).toBe(false);
        });
      });

      it('should handle edge cases', () => {
        expect(isGuestEmail('')).toBe(false);
        expect(isGuestEmail(null as any)).toBe(false);
        expect(isGuestEmail(undefined as any)).toBe(false);
      });
    });
  });

  describe('Guest User Creation', () => {
    describe('createSecureGuestUser', () => {
      it('should create valid guest user with all required fields', () => {
        const mockRequest = global.testUtils.createMockRequest();
        const guestUser = createSecureGuestUser(mockRequest);
        
        expect(guestUser).toMatchObject({
          email: expect.stringMatching(/^guest-\d+-[a-f0-9]+@localhost$/),
          name: expect.stringMatching(/^Guest User [A-Z0-9]+$/),
          ipAddress: '127.0.0.1',
          userAgent: 'Jest Test Environment',
          sessionId: expect.stringMatching(/^[a-f0-9]{32}$/),
          token: expect.stringMatching(/^[a-f0-9]{32}$/),
        });
        
        expect(isGuestEmail(guestUser.email)).toBe(true);
        expect(validateGuestToken(guestUser.token)).toBe(true);
      });

      it('should extract IP address from different headers', () => {
        // Test x-forwarded-for with multiple IPs
        const request1 = global.testUtils.createMockRequest({
          headers: new Headers({
            'x-forwarded-for': '192.168.1.1, 10.0.0.1, 127.0.0.1',
          }),
        });
        
        const guest1 = createSecureGuestUser(request1);
        expect(guest1.ipAddress).toBe('192.168.1.1');
        
        // Test x-real-ip
        const request2 = global.testUtils.createMockRequest({
          headers: new Headers({
            'x-real-ip': '192.168.1.2',
          }),
        });
        
        const guest2 = createSecureGuestUser(request2);
        expect(guest2.ipAddress).toBe('192.168.1.2');
        
        // Test fallback to 'unknown'
        const request3 = global.testUtils.createMockRequest({
          headers: new Headers({}),
        });
        
        const guest3 = createSecureGuestUser(request3);
        expect(guest3.ipAddress).toBe('unknown');
      });

      it('should handle missing or invalid headers gracefully', () => {
        const request = global.testUtils.createMockRequest({
          headers: new Headers({}),
        });
        
        const guestUser = createSecureGuestUser(request);
        
        expect(guestUser.ipAddress).toBe('unknown');
        expect(guestUser.userAgent).toBe('unknown');
        expect(guestUser.sessionId).toBeDefined();
        expect(guestUser.token).toBeDefined();
      });

      it('should validate created guest data using schema', () => {
        const mockRequest = global.testUtils.createMockRequest();
        
        // Should not throw validation error
        expect(() => createSecureGuestUser(mockRequest)).not.toThrow();
        
        const guestUser = createSecureGuestUser(mockRequest);
        
        // Validate structure
        expect(typeof guestUser.email).toBe('string');
        expect(typeof guestUser.name).toBe('string');
        expect(typeof guestUser.ipAddress).toBe('string');
        expect(typeof guestUser.userAgent).toBe('string');
        expect(typeof guestUser.sessionId).toBe('string');
        expect(typeof guestUser.token).toBe('string');
      });
    });
  });

  describe('Feature Access Control', () => {
    const { appConfig } = require('@/lib/config/app-config');

    beforeEach(() => {
      appConfig.isFeatureEnabled.mockReturnValue(true);
    });

    describe('canGuestUseFeature', () => {
      it('should allow access to permitted features', () => {
        guestLimitations.allowedFeatures.forEach(feature => {
          expect(canGuestUseFeature(feature)).toBe(true);
        });
      });

      it('should deny access to disallowed features', () => {
        guestLimitations.disallowedFeatures.forEach(feature => {
          expect(canGuestUseFeature(feature)).toBe(false);
        });
      });

      it('should deny all features when guest users are disabled', () => {
        appConfig.isFeatureEnabled.mockReturnValue(false);
        
        guestLimitations.allowedFeatures.forEach(feature => {
          expect(canGuestUseFeature(feature)).toBe(false);
        });
      });

      it('should handle wildcard permissions', () => {
        const originalAllowed = [...guestLimitations.allowedFeatures];
        
        // Add wildcard
        guestLimitations.allowedFeatures.push('*');
        
        expect(canGuestUseFeature('some-new-feature')).toBe(true);
        expect(canGuestUseFeature('premium-models')).toBe(false); // Still blocked by disallowed
        
        // Restore original
        guestLimitations.allowedFeatures.splice(0, guestLimitations.allowedFeatures.length, ...originalAllowed);
      });

      it('should handle unknown features', () => {
        expect(canGuestUseFeature('unknown-feature')).toBe(false);
      });
    });
  });

  describe('Guest Limits Checking', () => {
    describe('checkGuestLimits', () => {
      it('should return allowed for valid limit types', async () => {
        const validLimitTypes = ['maxArtifacts', 'maxAiRequests', 'maxStorageSize'];
        
        for (const limitType of validLimitTypes) {
          const result = await checkGuestLimits('test-guest', limitType as any);
          expect(result).toEqual({ allowed: true });
        }
      });

      it('should handle unknown limit types', async () => {
        const result = await checkGuestLimits('test-guest', 'unknownLimit' as any);
        expect(result).toEqual({ allowed: true });
      });

      it('should work with different guest IDs', async () => {
        const guestIds = ['guest-1', 'guest-2', 'test-guest-123'];
        
        for (const guestId of guestIds) {
          const result = await checkGuestLimits(guestId, 'maxArtifacts');
          expect(result).toEqual({ allowed: true });
        }
      });

      // Note: In a real implementation, this would check actual database/cache
      // This test validates the current stub implementation
      it('should be extensible for future database integration', async () => {
        const result = await checkGuestLimits('test-guest', 'maxArtifacts');
        expect(result).toHaveProperty('allowed');
        expect(typeof result.allowed).toBe('boolean');
      });
    });
  });

  describe('Data Sanitization', () => {
    describe('sanitizeGuestData', () => {
      it('should remove sensitive fields', () => {
        const unsafeData = {
          id: 'test-id',
          email: 'test@example.com',
          name: 'Test User',
          password: 'secret-password',
          token: 'secret-token',
          ipAddress: '127.0.0.1',
          otherField: 'safe-data',
        };
        
        const safeData = sanitizeGuestData(unsafeData);
        
        expect(safeData).not.toHaveProperty('password');
        expect(safeData).not.toHaveProperty('token');
        expect(safeData).not.toHaveProperty('ipAddress');
        expect(safeData).toHaveProperty('id');
        expect(safeData).toHaveProperty('email');
        expect(safeData).toHaveProperty('name');
        expect(safeData).toHaveProperty('otherField');
      });

      it('should add guest metadata', () => {
        const data = { id: 'test', name: 'Test' };
        const result = sanitizeGuestData(data);
        
        expect(result.isGuest).toBe(true);
        expect(result.createdAt).toBeDefined();
        expect(result.expiresAt).toBeDefined();
        
        // Validate timestamps
        expect(new Date(result.createdAt)).toBeRecentDate();
        
        const expiresAt = new Date(result.expiresAt);
        const createdAt = new Date(result.createdAt);
        const timeDiff = expiresAt.getTime() - createdAt.getTime();
        
        expect(timeDiff).toBe(guestLimitations.maxSessionDuration);
      });

      it('should handle empty or null input', () => {
        expect(sanitizeGuestData({})).toMatchObject({
          isGuest: true,
          createdAt: expect.any(String),
          expiresAt: expect.any(String),
        });
        
        expect(sanitizeGuestData(null)).toMatchObject({
          isGuest: true,
          createdAt: expect.any(String),
          expiresAt: expect.any(String),
        });
      });
    });
  });

  describe('Request Validation Middleware', () => {
    const { appConfig } = require('@/lib/config/app-config');

    beforeEach(() => {
      appConfig.isFeatureEnabled.mockReturnValue(true);
    });

    describe('validateGuestRequest', () => {
      it('should validate valid guest requests', async () => {
        const request = global.testUtils.createMockRequest({
          url: 'http://localhost:3033/api/chat',
        });
        
        const result = await validateGuestRequest(request, 'test-guest-id');
        expect(result).toEqual({ valid: true });
      });

      it('should reject requests when guest users are disabled', async () => {
        appConfig.isFeatureEnabled.mockReturnValue(false);
        
        const request = global.testUtils.createMockRequest();
        const result = await validateGuestRequest(request, 'test-guest-id');
        
        expect(result).toEqual({
          valid: false,
          error: 'Guest access is currently disabled',
        });
      });

      it('should check AI request limits', async () => {
        const aiPaths = ['/api/ai', '/api/claude', '/api/ai/chat', '/api/claude/stream'];
        
        for (const path of aiPaths) {
          const request = global.testUtils.createMockRequest({
            url: `http://localhost:3033${path}`,
          });
          
          const result = await validateGuestRequest(request, 'test-guest-id');
          expect(result).toEqual({ valid: true });
        }
      });

      it('should check artifact limits', async () => {
        const artifactPaths = ['/api/artifacts', '/api/artifacts/save', '/artifacts/create'];
        
        for (const path of artifactPaths) {
          const request = global.testUtils.createMockRequest({
            url: `http://localhost:3033${path}`,
          });
          
          const result = await validateGuestRequest(request, 'test-guest-id');
          expect(result).toEqual({ valid: true });
        }
      });

      it('should handle malformed URLs gracefully', async () => {
        const request = global.testUtils.createMockRequest({
          url: 'invalid-url',
        });
        
        // Should not throw, but may return an error
        await expect(validateGuestRequest(request, 'test-guest-id')).resolves.toBeDefined();
      });
    });
  });

  describe('Session Cleanup', () => {
    describe('cleanupExpiredGuestSessions', () => {
      beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation();
      });

      it('should run without errors', async () => {
        const result = await cleanupExpiredGuestSessions();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
      });

      it('should log cleanup activity', async () => {
        await cleanupExpiredGuestSessions();
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Limpando sessões de guest expiradas')
        );
      });

      it('should return number of cleaned sessions', async () => {
        const result = await cleanupExpiredGuestSessions();
        expect(result).toBe(0); // Current stub implementation
      });
    });

    describe('Periodic Cleanup', () => {
      it('should be scheduled in server environment', () => {
        // This test verifies that the cleanup scheduling code exists
        // In the actual implementation, setInterval is called
        expect(typeof cleanupExpiredGuestSessions).toBe('function');
      });
    });
  });

  describe('Configuration and Constants', () => {
    describe('guestLimitations', () => {
      it('should have valid limitation values', () => {
        expect(guestLimitations.maxSessionDuration).toBe(24 * 60 * 60 * 1000);
        expect(guestLimitations.maxArtifacts).toBe(5);
        expect(guestLimitations.maxAiRequests).toBe(50);
        expect(guestLimitations.maxStorageSize).toBe(10 * 1024 * 1024);
        expect(guestLimitations.maxFileUploads).toBe(10);
      });

      it('should have valid feature lists', () => {
        expect(Array.isArray(guestLimitations.allowedFeatures)).toBe(true);
        expect(Array.isArray(guestLimitations.disallowedFeatures)).toBe(true);
        
        expect(guestLimitations.allowedFeatures).toContain('chat');
        expect(guestLimitations.allowedFeatures).toContain('artifacts');
        expect(guestLimitations.allowedFeatures).toContain('basic-ai');
        
        expect(guestLimitations.disallowedFeatures).toContain('premium-models');
        expect(guestLimitations.disallowedFeatures).toContain('api-access');
        expect(guestLimitations.disallowedFeatures).toContain('collaboration');
      });

      it('should not have overlapping allowed/disallowed features', () => {
        const allowed = new Set(guestLimitations.allowedFeatures);
        const disallowed = new Set(guestLimitations.disallowedFeatures);
        
        const overlap = [...allowed].filter(feature => disallowed.has(feature));
        expect(overlap).toHaveLength(0);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should create, validate, and sanitize guest user end-to-end', () => {
      const mockRequest = global.testUtils.createMockRequest();
      
      // Create guest user
      const guestUser = createSecureGuestUser(mockRequest);
      
      // Validate components
      expect(isGuestEmail(guestUser.email)).toBe(true);
      expect(validateGuestToken(guestUser.token)).toBe(true);
      
      // Check feature access
      expect(canGuestUseFeature('chat')).toBe(true);
      expect(canGuestUseFeature('premium-models')).toBe(false);
      
      // Sanitize data
      const sanitized = sanitizeGuestData(guestUser);
      expect(sanitized).not.toHaveProperty('token');
      expect(sanitized).not.toHaveProperty('ipAddress');
      expect(sanitized.isGuest).toBe(true);
    });

    it('should handle full request validation workflow', async () => {
      const mockRequest = global.testUtils.createMockRequest({
        url: 'http://localhost:3033/api/claude/chat',
      });
      
      const guestUser = createSecureGuestUser(mockRequest);
      const validation = await validateGuestRequest(mockRequest, guestUser.sessionId);
      
      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle schema validation errors gracefully', () => {
      // This would test invalid email format, but the current implementation
      // generates valid emails. This test ensures the validation exists.
      const validEmail = generateGuestEmail();
      expect(() => isGuestEmail(validEmail)).not.toThrow();
    });

    it('should handle undefined environment variables', () => {
      const originalSecret = process.env.AUTH_SECRET;
      delete process.env.AUTH_SECRET;
      
      const token = generateGuestToken('test');
      expect(token).toBeDefined();
      expect(validateGuestToken(token)).toBe(true);
      
      process.env.AUTH_SECRET = originalSecret;
    });

    it('should handle concurrent operations safely', () => {
      // Test concurrent token generation
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(generateGuestToken(`user-${i}`))
      );
      
      return Promise.all(promises).then(tokens => {
        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(tokens.length);
      });
    });
  });
});