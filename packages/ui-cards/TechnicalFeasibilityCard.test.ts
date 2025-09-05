import { describe, expect, it } from 'vitest';
import { technicalFeasibilitySchema } from './TechnicalFeasibilityCard';

describe('technicalFeasibilitySchema', () => {
  it('validates proper data', () => {
    const data = {
      roof_suitability: 'alto',
      site_constraints: ['sombra', 'estrutura fraca'],
      utility_rules: ['regra 1', 'regra 2'],
      viability_score: 80,
    };
    expect(technicalFeasibilitySchema.parse(data)).toEqual(data);
  });

  it('rejects scores outside range', () => {
    const badData = {
      roof_suitability: 'alto',
      site_constraints: [],
      utility_rules: [],
      viability_score: 120,
    };
    expect(() => technicalFeasibilitySchema.parse(badData)).toThrow();
  });
});

