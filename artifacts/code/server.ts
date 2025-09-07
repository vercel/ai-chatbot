export function createCodeArtifact(code: string) {
  return { type: 'code', content: code };
}

export const codeDocumentHandler = {
  create: createCodeArtifact,
  update: (doc: any, update: any) => ({ ...doc, ...update })
};