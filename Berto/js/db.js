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

// =========================================================
// BERTO LONG-TERM PERSISTENT MEMORY (Serverless / IndexedDB)
// =========================================================

class LocalMemoryEngine {
  constructor() {
    this.memoryKey = 'berto-persistent-memories';
    this.memories = [];
    this.load();
  }

  async load() {
    if (typeof dbStorage !== 'undefined') {
      const stored = await dbStorage.get('settings', this.memoryKey);
      if (stored) this.memories = stored;
    } else {
      const raw = localStorage.getItem(this.memoryKey);
      if (raw) this.memories = JSON.parse(raw);
    }
  }

  async addMemory(fact) {
    if (!fact || this.memories.includes(fact)) return;
    this.memories.push({
      id: `mem_${Date.now()}`,
      fact: fact.trim(),
      date: new Date().toLocaleDateString()
    });
    await this.save();
    if (typeof toast === 'function') toast(`Memory Saved: "${fact.slice(0, 30)}..."`, 'info');
  }

  async removeMemory(id) {
    this.memories = this.memories.filter(m => m.id !== id);
    await this.save();
  }

  async removeMemoryByText(keyword) {
    const lower = keyword.toLowerCase();
    const initialCount = this.memories.length;
    this.memories = this.memories.filter(m => !m.fact.toLowerCase().includes(lower));
    if (this.memories.length < initialCount) {
      await this.save();
      if (typeof toast === 'function') toast(`Memory forgotten: "${keyword}"`, 'info');
      return true;
    }
    return false;
  }

  async save() {
    if (typeof dbStorage !== 'undefined') {
      await dbStorage.set('settings', this.memoryKey, this.memories);
    } else {
      localStorage.setItem(this.memoryKey, JSON.stringify(this.memories));
    }
  }

  getSystemPromptContext() {
    if (!this.memories.length) return '';
    const factList = this.memories.map(m => `- ${m.fact}`).join('\n');
    return `
━━━━━━━━━━━━━━━━━━
LONG-TERM REMEMBERED FACTS ABOUT USER (MEMORY STORE)
━━━━━━━━━━━━━━━━━━
${factList}
`;
  }
}

window.bertoMemory = new LocalMemoryEngine();
