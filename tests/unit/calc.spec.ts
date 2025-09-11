import { describe, it, expect } from 'vitest';
import {
  calculateViabilityFallback,
  calculatePaybackYears,
  calculateKwhPerKwpMonth,
  estimateOffsetTarget,
  calculateEstimatedKwp,
} from '@/lib/analysis/calc';

describe('Analysis Calculations', () => {
  describe('calculateKwhPerKwpMonth', () => {
    it('calculates kWh per kWp per month correctly', () => {
      const irradiance = 4.5; // kWh/kWp/day
      const pr = 0.75;

      const result = calculateKwhPerKwpMonth(irradiance, pr);

      expect(result).toBe(4.5 * 30 * 0.75); // 101.25
    });

    it('uses default values when not provided', () => {
      const result = calculateKwhPerKwpMonth();

      expect(result).toBe(4.5 * 30 * 0.75); // 101.25
    });
  });

  describe('estimateOffsetTarget', () => {
    it('returns 0.4 for small consumption', () => {
      const result = estimateOffsetTarget(150);
      expect(result).toBe(0.4);
    });

    it('returns 0.6 for medium consumption', () => {
      const result = estimateOffsetTarget(300);
      expect(result).toBe(0.6);
    });

    it('returns 0.8 for high consumption', () => {
      const result = estimateOffsetTarget(800);
      expect(result).toBe(0.8);
    });

    it('returns 1.0 for very high consumption', () => {
      const result = estimateOffsetTarget(1500);
      expect(result).toBe(1.0);
    });
  });

  describe('calculateEstimatedKwp', () => {
    it('calculates kWp correctly', () => {
      const avgKwhMonth = 500;
      const kwhPerKwpMonth = 135;
      const offsetTarget = 0.8;

      const result = calculateEstimatedKwp(avgKwhMonth, kwhPerKwpMonth, offsetTarget);

      expect(result).toBeCloseTo(500 * 0.8 / 135, 2); // ~2.96
    });
  });

  describe('calculatePaybackYears', () => {
    it('calculates payback period correctly', () => {
      const capex = 10000;
      const savingsMonth = 200;

      const payback = calculatePaybackYears(capex, savingsMonth);

      expect(payback).toBe(10000 / (200 * 12)); // ~4.17
    });

    it('handles zero savings', () => {
      const capex = 5000;
      const savingsMonth = 0;

      const payback = calculatePaybackYears(capex, savingsMonth);

      expect(payback).toBe(Number.POSITIVE_INFINITY);
    });
  });

  describe('calculateViabilityFallback', () => {
    it('calculates system size correctly', () => {
      const input = {
        persona: 'owner' as const,
        avg_kwh_month: 500,
        tariff_rs_kwh: 0.8,
      };

      const result = calculateViabilityFallback(input);

      expect(result.estimates.estimated_kwp).toBeGreaterThan(0);
      expect(result.inputs.persona).toBe('owner');
    });

    it('uses default assumptions when not provided', () => {
      const input = {
        persona: 'owner' as const,
        avg_kwh_month: 300,
        tariff_rs_kwh: 0.6,
      };

      const result = calculateViabilityFallback(input);

      expect(result.assumptions.PR).toBe(0.75);
      expect(result.assumptions.kwh_per_kwp_month).toBe(101.25); // 4.5 * 30 * 0.75
    });

    it('calculates savings correctly', () => {
      const input = {
        persona: 'owner' as const,
        avg_kwh_month: 400,
        tariff_rs_kwh: 0.7,
      };

      const result = calculateViabilityFallback(input);

      expect(result.estimates.savings_month).toBeGreaterThan(0);
      expect(result.estimates.payback_years).toBeGreaterThan(0);
    });

    it('handles zero tariff', () => {
      const input = {
        persona: 'owner' as const,
        avg_kwh_month: 300,
        tariff_rs_kwh: 0,
      };

      const result = calculateViabilityFallback(input);

      expect(result.estimates.savings_month).toBe(0);
      expect(result.estimates.payback_years).toBe(Number.POSITIVE_INFINITY);
    });
  });
});