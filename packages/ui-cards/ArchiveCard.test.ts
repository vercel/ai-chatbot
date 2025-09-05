import { describe, expect, it } from 'vitest';
import { calculateTTL } from './ArchiveCard';

describe('calculateTTL', () => {
  it('returns remaining days until expiration', () => {
    const ttl = calculateTTL('2024-01-01T00:00:00Z', 10, new Date('2024-01-01T00:00:00Z'));
    expect(ttl).toBe(10);
  });

  it('returns 0 for expired archives', () => {
    const ttl = calculateTTL('2024-01-01T00:00:00Z', 10, new Date('2024-01-15T00:00:00Z'));
    expect(ttl).toBe(0);
  });
});
