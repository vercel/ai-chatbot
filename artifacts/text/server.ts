export function createTextArtifact(text: string) {
  return { type: 'text', content: text };
}

export const textDocumentHandler = {
  create: createTextArtifact,
  update: (doc: any, update: any) => ({ ...doc, ...update })
};