import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ChartKit, { type ChartKitHandle } from './ChartKit';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,abc'),
}));

describe('ChartKit', () => {
  it('renders with accessible role', () => {
    const { getByRole } = render(
      <ChartKit type="histogram" data={[1, 2, 3]} ariaLabel="Histogram" />,
    );
    expect(getByRole('img', { name: 'Histogram' })).toBeTruthy();
  });

  it('exports PNG image', async () => {
    const ref = React.createRef<ChartKitHandle>();
    render(
      <ChartKit
        ref={ref}
        type="histogram"
        data={[1, 2, 3]}
        ariaLabel="Histogram"
      />,
    );
    const url = await ref.current?.exportToPNG();
    expect(url).toContain('data:image/png');
  });
});
