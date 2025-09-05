import { describe, expect, it } from 'vitest';
import { applyPricingRules, priceFromBOM } from './PricingRules';

describe('applyPricingRules', () => {
  it('calculates totals with markup, logistics and contingency', () => {
    const result = applyPricingRules(1000, {
      markup: 0.1,
      logistics: 50,
      contingency: 0.05,
    });
    expect(result.base).toBe(1000);
    expect(result.markup).toBe(100);
    expect(result.logistics).toBe(50);
    expect(result.contingency).toBe(50);
    expect(result.total).toBe(1200);
  });
});

describe('priceFromBOM', () => {
  it('sums bom items before applying pricing rules', () => {
    const result = priceFromBOM(
      [
        { name: 'panel', cost: 500 },
        { name: 'inverter', cost: 300 },
      ],
      { markup: 0.1, logistics: 50, contingency: 0.1 },
    );
    expect(result.base).toBe(800);
    expect(result.total).toBeCloseTo(1010);
  });
});
