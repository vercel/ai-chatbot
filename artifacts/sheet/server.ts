export function createSheetArtifact(data: any) {
  return { type: 'sheet', content: data };
}

export const sheetDocumentHandler = {
  create: createSheetArtifact,
  update: (doc: any, update: any) => ({ ...doc, ...update })
};