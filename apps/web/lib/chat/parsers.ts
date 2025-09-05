import type { SourceRef } from './types';

export function parseSources(text: string): SourceRef[] {
  const regex = /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g;
  const out: SourceRef[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(text)) !== null) {
    out.push({ id: String(idx++), label: match[1], url: match[2] });
  }
  return out;
}
