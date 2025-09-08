import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SavingsDisplay } from './savings-display';

describe('SavingsDisplay', () => {
  it('renders savings info and handles button click', async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();
    render(
      <SavingsDisplay
        monthlySavings={200}
        annualSavings={2400}
        co2Reduction={500}
        onViewDetails={onViewDetails}
      />,
    );
    expect(screen.getByText(/Economia Mensal/i)).toBeInTheDocument();
    expect(screen.getByText(/Economia Anual/i)).toBeInTheDocument();
    expect(screen.getByText(/Redução de CO₂/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Ver Detalhes Completos/i }));
    expect(onViewDetails).toHaveBeenCalled();
  });
});
