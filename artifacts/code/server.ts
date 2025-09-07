import { createDocumentHandler } from '@/lib/artifacts/server';

export function createCodeArtifact(code: string) {
  return { type: 'code', content: code };
}

export const codeDocumentHandler = createDocumentHandler({
  kind: 'code',
  onCreateDocument: async ({ id, title }) => {
    return title || 'Untitled Code';
  },
  onUpdateDocument: async ({ document }) => {
    return document.content || '';
  }
});