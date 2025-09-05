import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LayoutOptimizerPanel } from './LayoutOptimizerPanel';

vi.mock('../../../../../packages/ui-viewers/Roof3DViewer', () => ({
  Roof3DViewer: () => <div>viewer</div>,
}));

describe('LayoutOptimizerPanel', () => {
  afterEach(() => {
    cleanup();
  });

  it('updates card when inputs change', async () => {
    const user = userEvent.setup();
    render(<LayoutOptimizerPanel />);
    const tiltInput = screen.getByLabelText('tilt');
    await user.clear(tiltInput);
    await user.type(tiltInput, '45');
    expect(screen.getByLabelText('layout card').textContent).toContain('Tilt: 45');
  });

  it('auto resets to default values', async () => {
    const user = userEvent.setup();
    render(<LayoutOptimizerPanel />);
    const tiltInput = screen.getByLabelText('tilt') as HTMLInputElement;
    await user.clear(tiltInput);
    await user.type(tiltInput, '40');
    await user.click(screen.getByRole('button', { name: /auto/i }));
    expect(tiltInput.value).toBe('30');
  });

  it('optimize sets optimized values', async () => {
    const user = userEvent.setup();
    render(<LayoutOptimizerPanel />);
    await user.click(screen.getByRole('button', { name: /otimizar/i }));
    expect(screen.getByLabelText('layout card').textContent).toContain('Tilt: 35');
    expect(screen.getByLabelText('layout card').textContent).toContain('Azimuth: 170');
  });

  it('clamps values within valid ranges', async () => {
    const user = userEvent.setup();
    render(<LayoutOptimizerPanel />);
    const tiltInput = screen.getByLabelText('tilt') as HTMLInputElement;
    await user.clear(tiltInput);
    await user.type(tiltInput, '120');
    expect(tiltInput.value).toBe('90');
    const spacingInput = screen.getByLabelText('spacing') as HTMLInputElement;
    fireEvent.change(spacingInput, { target: { value: '-5' } });
    expect(spacingInput.value).toBe('0');
  });
});
