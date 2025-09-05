export type ArtifactType = 'text' | 'code';

export interface Artifact {
  id: string;
  title: string;
  type: ArtifactType;
  content: string;
  language?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TextArtifact extends Artifact {
  type: 'text';
  metadata?: {
    wordCount: number;
    charCount: number;
  };
}

export interface CodeArtifact extends Artifact {
  type: 'code';
  language: string;
  output?: string;
}

export interface ArtifactPanelProps {
  artifact: Artifact;
  onUpdate: (updates: Partial<Artifact>) => void;
  onClose: () => void;
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
}

export interface StorageService {
  save: (key: string, data: any) => void;
  load: (key: string) => any;
  remove: (key: string) => void;
  clear: () => void;
}