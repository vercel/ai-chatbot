import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import JSONCSVViewer from './JSONCSVViewer';

describe('JSONCSVViewer', () => {
  const schema = z.array(z.object({ name: z.string(), age: z.number() }));
  const value = [{ name: 'Alice', age: 30 }];

  it('reverts to original data', () => {
    render(<JSONCSVViewer value={value} schema={schema} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '{' } });
    expect(
      screen.getByText(/Expected property name|Unexpected token/),
    ).toBeTruthy();
    fireEvent.click(screen.getByText('Reverter mudanças'));
    expect(textarea.value).toBe(JSON.stringify(value, null, 2));
    expect(screen.queryByText(/Expected property name|Unexpected token/)).toBeNull();
  });
});
