import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ConsentManager } from './ConsentManager';

describe('ConsentManager', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('persists consent selections', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ConsentManager />);
    const emailCheckbox = screen.getByLabelText(/email \(marketing\)/i);
    await user.click(emailCheckbox);
    expect((emailCheckbox as HTMLInputElement).checked).toBe(true);
    unmount();
    render(<ConsentManager />);
    const rerendered = screen.getByLabelText(/email \(marketing\)/i) as HTMLInputElement;
    expect(rerendered.checked).toBe(true);
  });

  it('records history of consent changes', async () => {
    const user = userEvent.setup();
    render(<ConsentManager />);
    const emailCheckbox = screen.getByLabelText(/email \(marketing\)/i);
    await user.click(emailCheckbox);
    const history = JSON.parse(localStorage.getItem('owner-consent-history') || '[]');
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ scope: 'marketing', type: 'email', action: 'granted' });
  });
});
