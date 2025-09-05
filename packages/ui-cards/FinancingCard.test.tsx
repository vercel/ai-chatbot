import { describe, expect, it } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import FinancingCard, {
  sortOffersByTotalCost,
  type FinancingOffer,
} from './FinancingCard';

describe('sortOffersByTotalCost', () => {
  it('orders offers by total cost ascending', () => {
    const offers: FinancingOffer[] = [
      { provider: 'A', rate: 2, term: 12, monthly: 100 }, // total 1200
      { provider: 'B', rate: 3, term: 12, monthly: 90 }, // total 1080
      { provider: 'C', rate: 1, term: 12, monthly: 110 }, // total 1320
    ];
    const sorted = sortOffersByTotalCost(offers);
    expect(sorted.map((o) => o.provider)).toEqual(['B', 'A', 'C']);
  });
});

describe('FinancingCard', () => {
  it('highlights the best option', () => {
    const offers: FinancingOffer[] = [
      { provider: 'A', rate: 2, term: 12, monthly: 100 },
      { provider: 'B', rate: 3, term: 12, monthly: 90 },
      { provider: 'C', rate: 1, term: 12, monthly: 110 },
    ];
    render(<FinancingCard offers={offers} />);
    const bestRow = screen.getByLabelText('best option');
    expect(bestRow).toBeTruthy();
    expect(bestRow.textContent).toContain('B');
  });
});
