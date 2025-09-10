// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import ResponsesPage from '../app/(chat)/responses/page';
import { useChat } from '../app/(chat)/responses/hooks/useChat';
import { clearCache } from '../lib/store/messages';

beforeEach(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  });
  clearCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Responses page', () => {
  it('renders basic layout', () => {
    render(<ResponsesPage />);
    expect(screen.getByPlaceholderText('Digite uma mensagem')).not.toBeNull();
  });
});

describe('useChat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sends message successfully', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
    const { result } = renderHook(() => useChat({ threadId: 't1', pollInterval: 0 }));
    await act(async () => {
      await result.current.sendMessage('hello');
    });
    expect(result.current.messages[0].content).toBe('hello');
    expect(localStorage.getItem('responses:t1')).not.toBeNull();
  });

  it('handles send error', async () => {
    (fetch as any).mockResolvedValue({ ok: false });
    const { result } = renderHook(() => useChat({ threadId: 't1', pollInterval: 0 }));
    await act(async () => {
      await result.current.sendMessage('hello');
    });
    expect(result.current.error).toBeTruthy();
  });

  it('restores persisted history', () => {
    localStorage.setItem('responses:t1', JSON.stringify([{ id: '1', role: 'user', content: 'stored' }]));
    const { result } = renderHook(() => useChat({ threadId: 't1', pollInterval: 0 }));
    expect(result.current.messages[0].content).toBe('stored');
  });
});
