import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ParameterSheet } from './ParameterSheet';

describe('ParameterSheet validation', () => {
  const schema = z.object({
    volume: z
      .number()
      .min(0)
      .max(10)
      .refine((v) => v % 2 === 0, 'Must be even'),
    mode: z.enum(['auto', 'manual']),
  });

  afterEach(() => {
    cleanup();
  });

  it('shows validation errors instantly and applies when valid', async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(
      <ParameterSheet
        schema={schema}
        initialValues={{ volume: 4, mode: 'auto' }}
        onApply={onApply}
      />,
    );

    const slider = screen.getByRole('slider', { name: 'volume' });
    fireEvent.input(slider, { target: { value: 5 } });
    expect(screen.getByRole('alert').textContent).toContain('Must be even');
    const btn = screen.getByRole('button', { name: /apply and re-run/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    fireEvent.input(slider, { target: { value: 6 } });
    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(btn);
    expect(onApply).toHaveBeenCalledWith({ volume: 6, mode: 'auto' });
  });

  it('passes updated select values', async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(
      <ParameterSheet
        schema={schema}
        initialValues={{ volume: 4, mode: 'auto' }}
        onApply={onApply}
      />,
    );

    const select = screen.getByLabelText('mode');
    await user.selectOptions(select, 'manual');
    await user.click(screen.getByRole('button', { name: /apply and re-run/i }));
    expect(onApply).toHaveBeenCalledWith({ volume: 4, mode: 'manual' });
  });
});

