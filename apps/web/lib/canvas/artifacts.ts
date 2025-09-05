import type { ReactNode } from 'react';

export interface Artifact {
  id: string;
  type: string;
  data: unknown;
  createdAt: Date;
}

export interface ArtifactRef {
  id: string;
  version: number;
}

export type ArtifactRenderer = (artifact: Artifact) => ReactNode;

const registry = new Map<string, ArtifactRenderer>();

export function registerRenderer(type: string, renderer: ArtifactRenderer) {
  registry.set(type, renderer);
}

export function getRenderer(type: string) {
  return registry.get(type);
}

export function renderArtifact(artifact: Artifact): ReactNode {
  const renderer = registry.get(artifact.type);
  return renderer ? renderer(artifact) : null;
}

