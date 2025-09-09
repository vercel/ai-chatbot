export interface StorageProvider {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
}

export const localStorageProvider: StorageProvider = {
  getItem: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  },
};
