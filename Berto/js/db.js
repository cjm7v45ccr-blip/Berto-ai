// Berto IndexedDB Storage Engine
const DB_NAME = `${typeof INSTANCE_PREFIX !== 'undefined' ? INSTANCE_PREFIX : 'berto'}-db`;
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Automatically create object stores if they don't exist yet
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const dbStorage = {
  async get(storeName, key) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn(`[IndexedDB] Failed to read ${key} from ${storeName}:`, e);
      return null;
    }
  },

  async set(storeName, key, value) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(value, key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn(`[IndexedDB] Failed to write ${key} to ${storeName}:`, e);
      return false;
    }
  },

  async remove(storeName, key) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn(`[IndexedDB] Failed to remove ${key} from ${storeName}:`, e);
      return false;
    }
  }
};