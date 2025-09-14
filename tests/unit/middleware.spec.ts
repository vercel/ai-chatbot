import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isAllowedPath } from '@/middleware';

vi.mock('next-auth/jwt', () => ({ getToken: vi.fn(async () => null) }));

describe('middleware allowlist & test/ci bypass', () => {
  const origEnv = { ...process.env };
  beforeEach(() => {
    process.env = { ...origEnv };
    delete process.env.AUTH_ALLOWLIST;
  });

  it('production without allowlist denies (not allowed)', () => {
    process.env.NODE_ENV = 'production';
    expect(isAllowedPath('/api/monitoring/performance')).toBe(false);
  });

  it('production with allowlist allows monitoring', () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_ALLOWLIST = '/ping,/api/monitoring/*';
    expect(isAllowedPath('/api/monitoring/performance')).toBe(true);
    expect(isAllowedPath('/ping')).toBe(true);
    expect(isAllowedPath('/api/omni/inbox')).toBe(false);
  });

  it('test env bypass for monitoring and omni', () => {
    process.env.NODE_ENV = 'test';
    expect(isAllowedPath('/api/monitoring/performance')).toBe(true);
    expect(isAllowedPath('/api/omni/inbox')).toBe(true);
    expect(isAllowedPath('/ping')).toBe(true);
  });

  it('ci env bypass for monitoring and omni', () => {
    process.env.NODE_ENV = 'ci';
    expect(isAllowedPath('/api/monitoring/performance')).toBe(true);
    expect(isAllowedPath('/api/omni/outbox')).toBe(true);
  });
});

