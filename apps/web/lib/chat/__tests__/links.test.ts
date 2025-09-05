import { describe, it, expect } from 'vitest';
import { sanitizeUrl, extractLinks } from '../links';

describe('link utilities', () => {
  it('sanitizes valid http urls', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
  });

  it('rejects javascript urls', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('extracts links from text', () => {
    const txt = 'Visit https://example.com and http://test.com';
    expect(extractLinks(txt)).toEqual([
      'https://example.com/',
      'http://test.com/',
    ]);
  });
});
