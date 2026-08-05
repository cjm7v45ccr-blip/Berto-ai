// Berto State Management & Persistence

const defaults = {
  chats: [], activeChatId: null, files: [], route: 'chat',
  model: 'lite', temperature: 0.7, topP: 0.9, autoScroll: true,
  theme: 'dark', density: 'comfortable', motion: true, tags: {},
  streaming: false,
  voiceFeaturesDisabled: false
};

let storageHealthy = true;

function checkStorageHealth() {
  try {
    const testKey = `__${INSTANCE_PREFIX}_storage_test__`;
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('[Berto] localStorage unavailable or blocked:', e);
    storageHealthy = false;
    return false;
  }
}

function readSessionStorage(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function readStorage(key, fallback) {
  if (!storageHealthy) {
    return readSessionStorage(key, fallback);
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (e) {
    console.error(`[Berto] Failed to read "${key}" from local storage:`, e);
    return readSessionStorage(key, fallback);
  }
}

function writeStorage(key, value) {
  if (storageHealthy) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error(`[Berto] Failed to write "${key}" to local storage:`, e);
      storageHealthy = false;
    }
  }
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error(`[Berto] Failed to write "${key}" to session storage:`, e);
    return false;
  }
}

class Store {
  constructor() {
    const saved = readStorage(CONFIG.storage.state, defaults);
    delete saved.streaming;
    this.state = {
      ...defaults,
      ...saved,
      chats: saved.chats?.length ? saved.chats : [this.newChatRecord('Untitled conversation')]
    };
    this.state.activeChatId ||= this.state.chats[0].id;
    this.profile = readStorage(CONFIG.storage.profile, {
      name: 'Clear & thoughtful',
      tone: 'Warm and precise',
      formality: 'Balanced',
      vocabulary: 'Plain language',
      style: 'Conversational',
      samples: []
    });
    this.listeners = new Set();
  }

  newChatRecord(title = 'Untitled conversation') {
    return {
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title,
      messages: [],
      pinned: false,
      archived: false,
      tags: [],
      updatedAt: Date.now(),
      summary: ''
    };
  }

  get activeChat() {
    return this.state.chats.find(chat => chat.id === this.state.activeChatId) || this.state.chats[0];
  }

  get messages() {
    return this.activeChat?.messages || [];
  }

  update(patch) {
    Object.assign(this.state, patch);
    this.persist();
    return this.state;
  }

  persist() {
    try {
      const json = JSON.stringify(this.state);
      if (!writeStorage(CONFIG.storage.state, json)) {
        console.warn('[Berto] LocalStorage full. Backing up active state to IndexedDB...');
        dbStorage.set('settings', 'berto-active-state', this.state).catch(() => {});
      }
    } catch (e) {
      console.error('[Berto] State stringify/save error:', e);
    }
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  saveProfile(profile) {
    this.profile = profile;
    try { localStorage.setItem(CONFIG.storage.profile, JSON.stringify(profile)); } catch (e) {}
  }

  addChat(title = 'Untitled conversation') {
    const chat = this.newChatRecord(title);
    this.state.chats.unshift(chat);
    this.state.activeChatId = chat.id;
    this.persist();
    return chat;
  }

  selectChat(id) {
    this.update({ activeChatId: id, route: 'chat' });
  }

  togglePinChat(id) {
    const chat = this.state.chats.find(c => c.id === id);
    if (chat) {
      chat.pinned = !chat.pinned;
      this.persist();
    }
  }

  renameChat(id, title) {
    const chat = this.state.chats.find(c => c.id === id);
    if (chat && title.trim()) {
      chat.title = title.trim();
      this.persist();
    }
  }

  deleteChat(id) {
    this.state.chats = this.state.chats.filter(c => c.id !== id);
    if (!this.state.chats.length) {
      this.state.chats.push(this.newChatRecord('Untitled conversation'));
    }
    if (this.state.activeChatId === id) {
      this.state.activeChatId = this.state.chats[0].id;
    }
    this.persist();
  }

  autoTitleChat(id, firstPrompt) {
    const chat = this.state.chats.find(c => c.id === id);
    if (chat && (chat.title === 'Untitled conversation' || !chat.title)) {
      let title = firstPrompt.trim().replace(/^[^a-zA-Z0-9]+/, '').split('\n')[0];
      title = title.replace(/\[Attached File:.*\]/gi, '').trim().replace(/^[^a-zA-Z0-9]+/, '');
      if (title.length > 36) title = title.slice(0, 36) + '...';
      chat.title = title || 'New Chat';
      this.persist();
    }
  }

  addMessage(message) {
    const chat = this.activeChat;
    if (!chat) return;
    const msgId = window.crypto?.randomUUID ? window.crypto.randomUUID() : `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    chat.messages.push({ id: msgId, createdAt: Date.now(), ...message });
    chat.updatedAt = Date.now();
    this.persist();
    return chat.messages.at(-1);
  }

  updateMessage(id, patch) {
    const message = this.messages.find(item => item.id === id);
    if (message) {
      Object.assign(message, patch);
      this.activeChat.updatedAt = Date.now();
      this.persist();
    }
    return message;
  }

  removeMessage(id) {
    const chat = this.activeChat;
    if (chat) {
      chat.messages = chat.messages.filter(message => message.id !== id);
      this.persist();
    }
  }

  addFile(file) {
    this.state.files.unshift(file);
    this.persist();

    // Route large binary payloads (base64 images, large text) to IndexedDB
    const content = file.content || '';
    const isLarge = (file.bytes || content.length) > 256 * 1024; // > 256KB
    if (isLarge && content) {
      dbStorage.set('files', file.name, {
        name: file.name,
        content: content,
        isImage: file.isImage,
        mimeType: file.mimeType || file.type,
        bytes: file.bytes
      }).catch(err => console.warn('[Berto] IndexedDB file save failed:', err));
    }
  }

  removeFile(name) {
    this.state.files = this.state.files.filter(f => f.name !== name);
    this.persist();
    dbStorage.remove('files', name).catch(() => {});
  }

  exportData() {
    return JSON.stringify({ ...this.state, writingProfile: this.profile }, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.chats || !Array.isArray(data.chats)) {
        throw new Error('Invalid backup file format.');
      }
      this.state = { ...defaults, ...data };
      if (data.writingProfile) this.saveProfile(data.writingProfile);
      this.persist();
      renderChats();
      renderMessages();
      renderFiles();
      renderWritingProfile();
      toast('Workspace imported successfully!');
      return true;
    } catch (err) {
      toast(`Import failed: ${err.message}`, 'error');
      return false;
    }
  }
}

const store = new Store();