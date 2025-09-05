export interface SourceRef {
  id: string;
  label: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  sources?: SourceRef[];
  pinned?: boolean;
}

export type ToolStatus = 'pending' | 'running' | 'done' | 'error';

export interface ToolStep {
  id: string;
  label: string;
  status: ToolStatus;
  logs?: string[];
}

export type ErrorKind = 'offline' | 'timeout' | 'server';

export interface ErrorState {
  type: ErrorKind;
  message: string;
}
