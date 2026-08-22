/**
 * Native IndexedDB Wrapper for D R Thummar Portfolio
 * Enables ultra-fast (<100ms) initial boot asset hydration and state persistence.
 */

const DB_NAME = 'drthummar_portfolio_db';
const DB_VERSION = 1;

export const STORES = {
  ASSETS_CACHE: 'assets_cache',
  USER_PREFS: 'user_prefs',
} as const;

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
}

export function openPortfolioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.ASSETS_CACHE)) {
        db.createObjectStore(STORES.ASSETS_CACHE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.USER_PREFS)) {
        db.createObjectStore(STORES.USER_PREFS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function setCacheItem<T>(storeName: string, key: string, data: T): Promise<void> {
  try {
    const db = await openPortfolioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put({ key, data, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[IndexedDB] Failed to set cache item:', error);
  }
}

export async function getCacheItem<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await openPortfolioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as CacheEntry<T> | undefined;
        if (result) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[IndexedDB] Failed to get cache item:', error);
    return null;
  }
}

export async function clearPortfolioDB(): Promise<void> {
  try {
    const db = await openPortfolioDB();
    const tx = db.transaction([STORES.ASSETS_CACHE, STORES.USER_PREFS], 'readwrite');
    tx.objectStore(STORES.ASSETS_CACHE).clear();
    tx.objectStore(STORES.USER_PREFS).clear();
  } catch (error) {
    console.warn('[IndexedDB] Failed to clear DB:', error);
  }
}
