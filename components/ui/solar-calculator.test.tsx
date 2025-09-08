import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SolarCalculator } from './solar-calculator';

describe('SolarCalculator', () => {
  it('calculates and shows results', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onComplete = vi.fn();
    render(<SolarCalculator onCalculationComplete={onComplete} />);

    const consumption = screen.getByLabelText(/Consumo Mensal/i);
    await user.clear(consumption);
    await user.type(consumption, '500');
    await user.click(screen.getByRole('button', { name: /Calcular Economia Solar/i }));

    vi.runAllTimers();

    expect(await screen.findByText(/Economia Mensal/i)).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalled();
  });
});
