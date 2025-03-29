import { Notebook } from '@/lib/types';

export interface StorageService {
  // Notebook operations
  getNotebooks(): Promise<{ id: string; title: string; updatedAt: string; blockCount: number }[]>;
  getNotebook(id: string): Promise<Notebook | null>;
  saveNotebook(notebook: Notebook): Promise<void>;
  deleteNotebook(id: string): Promise<void>;
  
  // File operations
  getFile(path: string): Promise<string>;
  saveFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
} 