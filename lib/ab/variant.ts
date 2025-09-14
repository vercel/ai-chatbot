"use client";

export type ABVariant = 'A' | 'B';

export function getGreetingVariantClient(): ABVariant {
  try {
    const m = document.cookie.match(/(?:^|; )ab_greeting=([^;]+)/);
    const v = decodeURIComponent(m?.[1] || '');
    return v === 'B' ? 'B' : 'A';
  } catch {
    return 'A';
  }
}

