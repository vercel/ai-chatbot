// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STACAssetViewer, mockAssets } from './STACAssetViewer';

// Mock clipboard API
beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global.navigator as any).clipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
  };
});

afterEach(() => {
  cleanup();
});

describe('STACAssetViewer', () => {
  it('renders asset rows', () => {
    render(<STACAssetViewer assets={mockAssets} pageSize={2} />);
    expect(screen.getByText(mockAssets[0].href)).toBeTruthy();
  });

  it('paginates assets', () => {
    render(<STACAssetViewer assets={mockAssets} pageSize={1} />);
    expect(screen.getByText(mockAssets[0].href)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(mockAssets[1].href)).toBeTruthy();
  });

  it('copies href to clipboard', () => {
    const writeText = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.navigator as any).clipboard.writeText = writeText;
    render(<STACAssetViewer assets={mockAssets.slice(0, 1)} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Copy asset href' }),
    );
    expect(writeText).toHaveBeenCalledWith(mockAssets[0].href);
  });
});
