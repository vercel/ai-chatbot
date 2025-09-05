import { describe, expect, it } from 'vitest';
import { computeIndicators } from './FinancialAnalysisCard';

describe('computeIndicators', () => {
  it('returns ROI and IRR as percentages', () => {
    const { roi, irr } = computeIndicators({ tariff: 100, losses: 0.1, years: 5 });
    expect(roi).toBeCloseTo(350);
    expect(irr).toBeGreaterThan(0);
    expect(irr).toBeLessThan(100);
  });

  it('NPV varies with years', () => {
    const short = computeIndicators({ tariff: 100, losses: 0.1, years: 1 });
    const long = computeIndicators({ tariff: 100, losses: 0.1, years: 5 });
    expect(long.npv).not.toBeCloseTo(short.npv);
  });

  it('recomputes indicators when assumptions change', () => {
    const base = computeIndicators({ tariff: 100, losses: 0.1, years: 5 });
    const changed = computeIndicators({ tariff: 120, losses: 0.1, years: 5 });
    expect(changed.roi).toBeGreaterThan(base.roi);
  });
});
