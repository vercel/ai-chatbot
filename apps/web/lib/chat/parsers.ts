import type { SourceRef } from './types';
import { sanitizeUrl } from './links';

export function parseSources(text: string): SourceRef[] {
  const regex = /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g;
  const out: SourceRef[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(text)) !== null) {
    const safeUrl = sanitizeUrl(match[2]);
    if (safeUrl) {
      out.push({ id: String(idx++), label: match[1], url: safeUrl });
    }
  }
  return out;
}
