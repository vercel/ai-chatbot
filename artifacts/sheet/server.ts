import { createDocumentHandler } from '@/lib/artifacts/server';

export function createSheetArtifact(data: any) {
  return { type: 'sheet', content: data };
}

export const sheetDocumentHandler = createDocumentHandler({
  kind: 'sheet',
  onCreateDocument: async ({ id, title }) => {
    return title || 'Untitled Sheet';
  },
  onUpdateDocument: async ({ document }) => {
    return document.content || '';
  }
});