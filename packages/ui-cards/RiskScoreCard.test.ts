import { describe, expect, it } from 'vitest';
import { getRiskBucket } from './RiskScoreCard';

describe('getRiskBucket', () => {
  it('returns low for scores below 34', () => {
    expect(getRiskBucket(0).bucket).toBe('low');
    expect(getRiskBucket(33).bucket).toBe('low');
  });

  it('returns medium for scores between 34 and 66', () => {
    expect(getRiskBucket(34).bucket).toBe('medium');
    expect(getRiskBucket(66).bucket).toBe('medium');
  });

  it('returns high for scores 67 and above', () => {
    expect(getRiskBucket(67).bucket).toBe('high');
    expect(getRiskBucket(100).bucket).toBe('high');
  });
});
