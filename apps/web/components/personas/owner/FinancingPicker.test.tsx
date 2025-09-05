import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { FinancingPicker } from './FinancingPicker';
import type { FinancingOffer } from '@/packages/ui-cards/FinancingCard';

describe('FinancingPicker', () => {
  const offers: FinancingOffer[] = [
    { provider: 'Bank A', rate: 3.5, term: 60, monthly: 200 },
    { provider: 'Bank B', rate: 4.0, term: 48, monthly: 220 },
  ];

  afterEach(() => {
    cleanup();
  });

  it('shows offer details on request', async () => {
    const user = userEvent.setup();
    render(<FinancingPicker offers={offers} />);
    await user.click(screen.getByRole('button', { name: 'details Bank A' }));
    expect(
      screen.getByRole('table', { name: 'financing offers' }),
    ).toBeTruthy();
  });

  it('selects and saves an offer', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<FinancingPicker offers={offers} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'select Bank B' }));
    await user.click(screen.getByRole('button', { name: 'save selection' }));
    expect(onSave).toHaveBeenCalledWith(offers[1]);
  });
});
