import { describe, expect, it } from 'vitest';
import { simulateFinancing } from './financingSimulator';

describe('simulateFinancing', () => {
  it('calculates monthly payment for non-zero interest', () => {
    const { monthlyPayment } = simulateFinancing({
      principal: 10000,
      annualRate: 0.06,
      termMonths: 24,
    });
    // Expected value calculated externally ~443.21
    expect(monthlyPayment).toBeCloseTo(443.21, 2);
  });

  it('calculates payback period when savings exceed payment', () => {
    const result = simulateFinancing({
      principal: 5000,
      annualRate: 0.05,
      termMonths: 12,
      monthlySavings: 600,
    });
    // payment around 428.04 => payback months approx ceil(5000 / (600-428.04)) = 30
    expect(result.paybackPeriodMonths).toBe(30);
  });

  it('throws on invalid input', () => {
    expect(() =>
      simulateFinancing({ principal: 0, annualRate: 0.05, termMonths: 12 }),
    ).toThrow();
  });
});
