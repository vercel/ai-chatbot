import type { ReactNode } from 'react';

export interface Artifact {
  id: string;
  type: string;
  data: unknown;
  createdAt: Date;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  connections?: string[];
  metadata?: Record<string, unknown>;
}

export interface ArtifactRef {
  id: string;
  version: number;
}

export type ArtifactRenderer = (artifact: CanvasArtifact, onUpdate?: (updates: Partial<CanvasArtifact>) => void) => ReactNode;

const registry = new Map<string, ArtifactRenderer>();

export function registerRenderer(type: string, renderer: ArtifactRenderer) {
  registry.set(type, renderer);
}

export function getRenderer(type: string) {
  return registry.get(type);
}

export function renderArtifact(
  artifact: CanvasArtifact,
  onUpdate?: (updates: Partial<CanvasArtifact>) => void
): ReactNode {
  const renderer = registry.get(artifact.type);
  return renderer ? renderer(artifact, onUpdate) : null;
}

// Enhanced artifact types for canvas integration
export interface CanvasArtifact extends Artifact {
  position: { x: number; y: number };
  size: { width: number; height: number };
  connections: string[];
  zIndex: number;
  isSelected: boolean;
  isDraggable: boolean;
  isResizable: boolean;
}

// Canvas-specific artifact types
export const CANVAS_ARTIFACT_TYPES = {
  TEXT_BLOCK: 'text-block',
  CODE_BLOCK: 'code-block',
  CHART: 'chart',
  IMAGE: 'image',
  CALCULATION: 'calculation',
  PROPOSAL_CARD: 'proposal-card',
  SIMULATION: 'simulation',
} as const;

export type CanvasArtifactType = typeof CANVAS_ARTIFACT_TYPES[keyof typeof CANVAS_ARTIFACT_TYPES];

// Utility functions for canvas artifacts
export function createCanvasArtifact(
  type: CanvasArtifactType,
  data: unknown,
  position: { x: number; y: number }
): CanvasArtifact {
  return {
    id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    type,
    data,
    createdAt: new Date(),
    position,
    size: { width: 300, height: 200 },
    connections: [],
    zIndex: 0,
    isSelected: false,
    isDraggable: true,
    isResizable: true,
    metadata: {},
  };
}

export function updateArtifactPosition(
  artifact: CanvasArtifact,
  position: { x: number; y: number }
): CanvasArtifact {
  return {
    ...artifact,
    position,
  };
}

export function updateArtifactSize(
  artifact: CanvasArtifact,
  size: { width: number; height: number }
): CanvasArtifact {
  return {
    ...artifact,
    size,
  };
}

export function connectArtifacts(
  sourceId: string,
  targetId: string,
  artifacts: CanvasArtifact[]
): CanvasArtifact[] {
  return artifacts.map(artifact => {
    if (artifact.id === sourceId && !artifact.connections.includes(targetId)) {
      return {
        ...artifact,
        connections: [...artifact.connections, targetId],
      };
    }
    return artifact;
  });
}

export function disconnectArtifacts(
  sourceId: string,
  targetId: string,
  artifacts: CanvasArtifact[]
): CanvasArtifact[] {
  return artifacts.map(artifact => {
    if (artifact.id === sourceId) {
      return {
        ...artifact,
        connections: artifact.connections.filter(id => id !== targetId),
      };
    }
    return artifact;
  });
}

