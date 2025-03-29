import { StorageService } from './storage-service';
import { LocalStorageService } from './local-storage';

let storageInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageInstance) {
    storageInstance = new LocalStorageService();
  }
  
  return storageInstance;
} 