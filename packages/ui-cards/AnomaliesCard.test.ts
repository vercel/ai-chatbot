import { describe, expect, it } from 'vitest';
import { isOutlier, type Thresholds } from './AnomaliesCard';

describe('isOutlier', () => {
  const thresholds: Thresholds = { lower: 0.2, upper: 0.8 };
  it('detects values below lower threshold', () => {
    expect(isOutlier(0.1, thresholds)).toBe(true);
  });
  it('detects values above upper threshold', () => {
    expect(isOutlier(0.9, thresholds)).toBe(true);
  });
  it('returns false for values within range', () => {
    expect(isOutlier(0.5, thresholds)).toBe(false);
  });
});
