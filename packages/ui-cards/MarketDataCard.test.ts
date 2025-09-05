import { describe, expect, it } from 'vitest';
import { calculateDeltas, type Offer } from './MarketDataCard';

describe('calculateDeltas', () => {
  it('computes delta vs previous offer', () => {
    const offers: Offer[] = [
      { vendor: 'A', sku: '1', price: 10, stamp: new Date('2023-01-01') },
      { vendor: 'A', sku: '1', price: 15, stamp: new Date('2023-01-02') },
      { vendor: 'A', sku: '1', price: 12, stamp: new Date('2023-01-03') },
    ];
    const rows = calculateDeltas(offers);
    expect(rows.map((r) => r.delta)).toEqual([0, 5, -3]);
  });
});
