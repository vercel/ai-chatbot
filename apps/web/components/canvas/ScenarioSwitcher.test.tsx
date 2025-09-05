import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScenarioSwitcher } from './ScenarioSwitcher';

describe('ScenarioSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
  });
  it('creates a scenario', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<ScenarioSwitcher onCreate={onCreate} />);
    await user.click(screen.getByRole('button', { name: 'Add scenario' }));
    expect(onCreate).toHaveBeenCalled();
    expect(screen.getAllByRole('textbox').length).toBe(2);
  });

  it('selects a scenario', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<ScenarioSwitcher onSelect={onSelect} />);
    const scenarioBtn = screen.getByRole('button', { name: 'Scenario A' });
    await user.click(scenarioBtn);
    expect(onSelect).toHaveBeenCalledWith(expect.any(String));
  });

  it('deletes a scenario', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<ScenarioSwitcher onDelete={onDelete} />);
    const delBtn = screen.getByRole('button', { name: 'Delete Scenario A' });
    await user.click(delBtn);
    expect(onDelete).toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});
