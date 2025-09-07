import { createDocumentHandler } from '@/lib/artifacts/server';

export function createTextArtifact(text: string) {
  return { type: 'text', content: text };
}

export const textDocumentHandler = createDocumentHandler({
  kind: 'text',
  onCreateDocument: async ({ id, title }) => {
    return title || 'Untitled Text';
  },
  onUpdateDocument: async ({ document }) => {
    return document.content || '';
  }
});