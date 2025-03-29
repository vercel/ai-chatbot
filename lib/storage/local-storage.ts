import fs from 'fs/promises';
import path from 'path';
import { Notebook } from '@/lib/types';
import { StorageService } from './storage-service';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const NOTEBOOKS_DIR = path.join(DATA_DIR, 'notebooks');
const FILES_DIR = path.join(DATA_DIR, 'files');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(NOTEBOOKS_DIR, { recursive: true });
    await fs.mkdir(FILES_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create directories:', error);
  }
}

export class LocalStorageService implements StorageService {
  constructor() {
    ensureDirectories();
  }
  
  async getNotebooks(): Promise<{ id: string; title: string; updatedAt: string; blockCount: number }[]> {
    try {
      const files = await fs.readdir(NOTEBOOKS_DIR);
      
      const notebooks = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async (file) => {
            const id = file.replace('.json', '');
            const notebook = await this.getNotebook(id);
            
            return {
              id,
              title: notebook?.title || 'Untitled',
              updatedAt: notebook?.blocks[notebook.blocks.length - 1]?.updated || 
                        new Date().toISOString(),
              blockCount: notebook?.blocks.length || 0
            };
          })
      );
      
      return notebooks;
    } catch (error) {
      console.error('Failed to get notebooks:', error);
      return [];
    }
  }
  
  async getNotebook(id: string): Promise<Notebook | null> {
    try {
      const filePath = path.join(NOTEBOOKS_DIR, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as Notebook;
    } catch (error) {
      console.error(`Failed to get notebook ${id}:`, error);
      return null;
    }
  }
  
  async saveNotebook(notebook: Notebook): Promise<void> {
    try {
      const filePath = path.join(NOTEBOOKS_DIR, `${notebook.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(notebook, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Failed to save notebook ${notebook.id}:`, error);
      throw error;
    }
  }
  
  async deleteNotebook(id: string): Promise<void> {
    try {
      const filePath = path.join(NOTEBOOKS_DIR, `${id}.json`);
      await fs.unlink(filePath);
      
      // Also delete associated files
      const notebook = await this.getNotebook(id);
      if (notebook) {
        await Promise.all(
          notebook.files.map(file => this.deleteFile(file.path))
        );
      }
    } catch (error) {
      console.error(`Failed to delete notebook ${id}:`, error);
      throw error;
    }
  }
  
  async getFile(filePath: string): Promise<string> {
    try {
      const fullPath = path.join(FILES_DIR, filePath);
      
      // Create parent directories if they don't exist
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Try to read the file, or return empty string if it doesn't exist
      try {
        return await fs.readFile(fullPath, 'utf-8');
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          return '';
        }
        throw err;
      }
    } catch (error) {
      console.error(`Failed to get file ${filePath}:`, error);
      throw error;
    }
  }
  
  async saveFile(filePath: string, content: string): Promise<void> {
    try {
      const fullPath = path.join(FILES_DIR, filePath);
      
      // Create parent directories if they don't exist
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      await fs.writeFile(fullPath, content, 'utf-8');
    } catch (error) {
      console.error(`Failed to save file ${filePath}:`, error);
      throw error;
    }
  }
  
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(FILES_DIR, filePath);
      await fs.unlink(fullPath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Failed to delete file ${filePath}:`, error);
        throw error;
      }
    }
  }
} 