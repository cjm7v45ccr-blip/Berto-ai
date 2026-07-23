// Berto AI Workspace - Core Application Engine

// 1. Configuration
const CONFIG = Object.freeze({
  maxContextMessages: 20,
  maxMessageChars: 8000,
  autosaveMs: 5000,
  requestTimeoutMs: 30000,
  streamTimeoutMs: 60000,
  maxRetries: 3,
  maxAttachmentSize: 7 * 1024 * 1024,
  maxContextBytes: 20 * 1024 * 1024,
  models: Object.freeze([
    { id: 'flash', label: 'Berto Fast', apiModel: 'gemini-3.6-flash', dailyLimit: 20 },
    { id: 'lite', label: 'Berto Lite', apiModel: 'gemini-3.5-flash-lite', dailyLimit: 100 },
    { id: 'fallback', label: 'Berto Fallback', apiModel: 'gemini-3.1-flash-lite', dailyLimit: 100 }
  ]),
  storage: Object.freeze({
    state: 'berto-state-v3',
    profile: 'berto-writing-profile',
    apiKey: 'berto-api-key',
    preferences: 'berto-preferences-v2'
  })
});

// 2. Utility Functions
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function getUserInfo() {
  const prefs = readStorage(CONFIG.storage.preferences, {});
  const name = prefs.userName || 'User';

  return {
    name,
    initial: name.charAt(0).toUpperCase()
  };
}

function getLocalDateKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function debounce(fn, wait) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
}

async function handleImagePaste(event) {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        if (file.size > CONFIG.maxAttachmentSize) {
          toast('Pasted image exceeds size limit', 'error');
          continue;
        }
        try {
          const base64Data = await fileToBase64(file);
          currentAttachments.push({
            name: file.name || `pasted_image_${Date.now()}.png`,
            type: file.type || 'image/png',
            mimeType: file.type || 'image/png',
            size: `${Math.max(1, Math.ceil(file.size / 1024))} KB`,
            bytes: file.size,
            content: base64Data,
            isImage: true,
            file
          });
          updateAttachmentLabel();
          updateCount();
        } catch (e) {
          toast('Failed to process pasted image', 'error');
        }
      }
    }
  }
}

function downloadText(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function formatCount(value) { return Number(value || 0).toLocaleString(); }
function wordCount(text = '') { return text.trim() ? text.trim().split(/\s+/).length : 0; }

function readability(text = '') {
  const words = wordCount(text);
  const sentences = Math.max(1, (text.match(/[.!?]+(?=\s|$)/g) || []).length);
  const syllables = Math.max(words, (text.toLowerCase().match(/[aeiouy]+/g) || []).length);
  return Math.max(0, Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / Math.max(words, 1))));
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 3. Markdown Rendering
function renderMarkdown(input = '') {
  const lines = escapeHtml(input).split('\n');
  let html = '';
  let inCode = false;
  let code = '';
  let language = '';

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        html += `<pre class="code-block"><button class="code-copy" data-code-copy="${encodeURIComponent(code)}">Copy</button><code class="language-${language}">${code}</code></pre>`;
        code = '';
        inCode = false;
      } else {
        language = line.slice(3).trim() || 'text';
        inCode = true;
      }
      continue;
    }
    if (inCode) { code += `${line}\n`; continue; }
    if (/^### /.test(line)) html += `<h4>${line.slice(4)}</h4>`;
    else if (/^## /.test(line)) html += `<h3>${line.slice(3)}</h3>`;
    else if (/^# /.test(line)) html += `<h2>${line.slice(2)}</h2>`;
    else if (/^[-*] /.test(line)) html += `<li>${inlineMarkdown(line.slice(2))}</li>`;
    else if (/^\d+\. /.test(line)) html += `<li>${inlineMarkdown(line.replace(/^\d+\. /, ''))}</li>`;
    else if (/^> /.test(line)) html += `<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`;
    else if (!line.trim()) html += '<div class="md-break"></div>';
    else html += `<p>${inlineMarkdown(line)}</p>`;
  }
  return html.replace(/(<li>.*?<\/li>\s*)+/g, list => `<ul>${list}</ul>`);
}

function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

// 4. Store (State Management)
const defaults = {
  chats: [], activeChatId: null, files: [], projects: [], route: 'chat',
  model: 'lite', temperature: 0.7, topP: 0.9, autoScroll: true,
  theme: 'dark', density: 'comfortable', motion: true, tags: {},
  streaming: false
};

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
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
      localStorage.setItem(CONFIG.storage.state, JSON.stringify(this.state));
    } catch (e) {}
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
  }

  removeFile(name) {
    this.state.files = this.state.files.filter(f => f.name !== name);
    this.persist();
  }

  addProject(project) {
    this.state.projects.push(project);
    this.persist();
  }

  updateProject(index, project) {
    if (this.state.projects[index]) {
      this.state.projects[index] = project;
      this.persist();
    }
  }

  removeProject(index) {
    this.state.projects.splice(index, 1);
    this.persist();
  }

  contextWindow() {
    return this.messages.slice(-CONFIG.maxContextMessages).map(({ role, content }) => ({
      role,
      content
    }));
  }

  exportData() {
    return JSON.stringify({ ...this.state, writingProfile: this.profile }, null, 2);
  }
}

// 5. ModelRouter (Gemini API Integration)
class ApiError extends Error {
  constructor(message, code, retryable = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;
  }
}

class ModelRouter {
  constructor() {
    this.abortController = null;
    try {
      this.usage = JSON.parse(localStorage.getItem('berto-model-usage') || '{}');
    } catch {
      this.usage = {};
    }
    const today = getLocalDateKey();
    for (const k of Object.keys(this.usage)) {
      if (!k.startsWith(today)) delete this.usage[k];
    }
  }

  key() {
    return localStorage.getItem(CONFIG.storage.apiKey)?.trim();
  }

  modelList(preferred = 'flash') {
    const models = [...CONFIG.models];
    const start = models.findIndex(model => model.id === preferred);
    return start > -1 ? [...models.slice(start), ...models.slice(0, start)].filter(m => m.id !== 'fallback') : models.filter(m => m.id !== 'fallback');
  }

  remaining(model) {
    const today = getLocalDateKey();
    return model.dailyLimit - Number(this.usage[`${today}:${model.id}`] || 0);
  }

  consume(model) {
    const today = getLocalDateKey();
    const key = `${today}:${model.id}`;
    this.usage[key] = Number(this.usage[key] || 0) + 1;
    for (const k of Object.keys(this.usage)) {
      if (!k.startsWith(today)) delete this.usage[k];
    }
    try { localStorage.setItem('berto-model-usage', JSON.stringify(this.usage)); } catch (e) {}
  }

  async request({ prompt, system, history = [], stream = false, preferred = 'flash', temperature = 0.7, topP = 0.9, onText, signal: externalSignal, images = [] } = {}) {
    const key = this.key();
    if (!key) throw new ApiError('Add your Gemini API key in Settings to start generating.', 'CONFIGURATION');

    this.abortController?.abort();
    this.abortController = new AbortController();
    const signal = externalSignal || this.abortController.signal;

    const userModel = CONFIG.models.find(m => m.id === preferred);
    const fallbackModel = CONFIG.models.find(m => m.id === 'fallback');
    if (!userModel) throw new ApiError(`Model "${preferred}" not found.`, 'CONFIGURATION');

    const modelOrder = [userModel];
    if (fallbackModel) modelOrder.push(fallbackModel);

    let lastError;
    for (const model of modelOrder) {
      if (this.remaining(model) <= 0) {
        lastError = new ApiError(`Your daily limit for ${model.label} (${model.dailyLimit}) is used up.`, 'QUOTA');
        continue;
      }
      for (let attempt = 0; attempt < CONFIG.maxRetries; attempt += 1) {
        try {
          const result = await this.callModel({ key, model, prompt, system, history, stream, temperature, topP, onText, signal, images });
          this.consume(model);
          return { ...result, model: model.label, modelId: model.id };
        } catch (error) {
          lastError = error;
          if (error.name === 'AbortError' || error.code === 'CONFIGURATION') throw error;
          if (!error.retryable) break;
          await sleep(2 ** attempt * 500, signal);
        }
      }
    }
    throw lastError || new ApiError('No model could complete the request.', 'UNAVAILABLE');
  }

  stop() {
    this.abortController?.abort();
  }

  async callModel({ key, model, prompt, system, history, stream, temperature, topP, onText, signal, images }) {
    const endpoint = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), stream ? CONFIG.streamTimeoutMs : CONFIG.requestTimeoutMs);
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });

    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.apiModel}:${endpoint}${separator}key=${encodeURIComponent(key)}`;
      
      const sanitizedHistory = (history || [])
        .filter(item => item && item.content && item.content.trim())
        .map(item => ({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.content }]
        }));

      const userParts = [];
      if (prompt && prompt.trim()) {
        userParts.push({ text: prompt });
      }

      if (images?.length) {
        images.forEach(img => {
          let base64Data = '';
          if (typeof img.data === 'string') {
            base64Data = img.data.includes(',') ? img.data.split(',')[1] : img.data;
          }
          if (base64Data) {
            userParts.push({
              inline_data: {
                mime_type: img.mimeType || 'image/jpeg',
                data: base64Data
              }
            });
          }
        });
      }

      const contents = [
        ...sanitizedHistory,
        { role: 'user', parts: userParts }
      ];

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature, topP }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        let errDetails = '';
        try {
          const errBody = await response.json();
          errDetails = errBody?.error?.message || '';
        } catch {}
        throw new ApiError(
          errDetails ? `Gemini API Error: ${errDetails}` : `Gemini request failed (${response.status}).`,
          `HTTP_${response.status}`,
          response.status === 429 || response.status >= 500
        );
      }

      if (!stream) {
        const data = await response.json();
        return {
          text: data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '',
          tokens: data.usageMetadata?.totalTokenCount || 0
        };
      }

      return this.readStream(response, onText, controller.signal);
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network request failed. Please check your connection or API key.', 'NETWORK', true);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }

  async readStream(response, onText, signal) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let output = '';

    while (true) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const raw = line.replace(/^data:\s*/, '').trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const data = JSON.parse(raw);
          const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
          if (text) {
            output += text;
            onText?.(output);
          }
        } catch (e) {}
      }
    }
    return { text: output, tokens: 0 };
  }
}

// 6. Application Logic & UI Handlers
const store = new Store();
const api = new ModelRouter();
let activeRequest = null;
let draftTimer = null;
let currentAttachments = [];

const savedUi = readStorage(CONFIG.storage.preferences, {});
applyPreferences({ ...store.state, ...savedUi });

function applyPreferences(prefs) {
  document.documentElement.dataset.theme = prefs.theme || 'dark';
  document.documentElement.dataset.density = prefs.density || 'comfortable';
  document.documentElement.dataset.motion = prefs.motion === false ? 'off' : 'full';
  
  const name = prefs.userName || 'User';
  if ($('#welcome-name')) $('#welcome-name').textContent = name;
  if ($('#sidebar-name')) $('#sidebar-name').textContent = name;
  
  const initial = (name.charAt(0) || 'U').toUpperCase();
  $$('.avatar').forEach(node => node.textContent = initial);
}

function savePreferences(patch) {
  const next = { ...savedUi, ...patch };
  try { localStorage.setItem(CONFIG.storage.preferences, JSON.stringify(next)); } catch (e) {}
  applyPreferences(next);
  store.update(patch);
}

function toast(message, type = 'info') {
  const stack = $('#toasts');
  if (!stack) return;
  const node = document.createElement('div');
  node.className = `toast toast-${type}`;
  node.textContent = message;
  stack.append(node);
  setTimeout(() => node.remove(), 3200);
}

function openModal(title, body) {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = body;
  $('#modal').hidden = false;
}

function closeModal() {
  $('#modal').hidden = true;
}

function route(routeName) {
  store.update({ route: routeName });
  $$('.view').forEach(view => view.classList.toggle('active', view.dataset.view === routeName));
  $$('.nav-item[data-route]').forEach(button => button.classList.toggle('active', button.dataset.route === routeName));
  $('#breadcrumb').textContent = routeName === 'chat' ? 'Chats' : routeName === 'writing' ? 'Writing Studio' : routeName[0].toUpperCase() + routeName.slice(1);
  closeMobile();
  if (routeName === 'files') renderFiles();
  if (routeName === 'projects') renderProjects();
  if (routeName === 'settings') renderSettings();
}

function closeMobile() {
  $('#sidebar')?.classList.remove('open');
  $('.drawer-scrim')?.classList.remove('open');
}

function renderChats(filter = '') {
  const chats = store.state.chats.filter(chat => !chat.archived && (!filter || chat.title.toLowerCase().includes(filter.toLowerCase())));
  chats.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  $('#chat-list').innerHTML = chats.map(chat => `
    <div class="chat-item-wrapper ${chat.id === store.state.activeChatId ? 'active' : ''}">
      <button class="chat-item ${chat.id === store.state.activeChatId ? 'active' : ''}" data-chat="${chat.id}">
        <span class="chat-pin-icon" data-action="pin-chat" data-chat-id="${chat.id}" title="${chat.pinned ? 'Unpin chat' : 'Pin chat'}">${chat.pinned ? '★' : '⌁'}</span>
        <span class="chat-title-text">${escapeHtml(chat.title)}</span>
      </button>
      <div class="chat-item-actions">
        <button class="chat-action-btn" data-action="rename-chat-modal" data-chat-id="${chat.id}" title="Rename">✎</button>
        <button class="chat-action-btn danger" data-action="delete-chat" data-chat-id="${chat.id}" title="Delete">×</button>
      </div>
    </div>
  `).join('') || '<div class="sidebar-empty">No chats found</div>';

  const count = $('.nav-count');
  if (count) count.textContent = store.state.chats.length;

  const currentModel = CONFIG.models.find(m => m.id === store.state.model);
  if (currentModel && $('#model-label')) {
    $('#model-label').textContent = currentModel.label;
  }
}

function renderMessages() {
  const box = $('#messages');
  const msgs = store.messages;
  showWelcome(msgs.length === 0);
  box.innerHTML = msgs.map(message => messageMarkup(message)).join('');
  box.querySelectorAll('[data-message]').forEach(node => node.classList.add('is-ready'));
  if (store.state.autoScroll) $('.chat-scroll').scrollTop = $('.chat-scroll').scrollHeight;
}

function messageMarkup(message) {
  const isUser = message.role === 'user';
  const { initial: userInitial } = getUserInfo();

  const meta = message.model
    ? `<div class="message-meta">${escapeHtml(message.model)}${message.tokens ? ` · ${formatCount(message.tokens)} tokens` : ''}</div>`
    : '';

  const imagesHtml = message.images?.length
    ? `<div class="message-images">${message.images.map(img => `<img src="${escapeHtml(img.data)}" alt="${escapeHtml(img.name || 'image')}">`).join('')}</div>`
    : '';

  return `
    <article class="message ${isUser ? 'user' : 'assistant'}" data-message="${message.id}">
      <div class="message-avatar">${isUser ? userInitial : 'B'}</div>
      <div class="message-stack">
        ${imagesHtml}
        <div class="message-body">${renderMarkdown(message.content || '')}</div>
        ${meta}
        <div class="message-actions">
          <button data-copy>Copy</button>
          ${!isUser ? '<button data-edit-message>Regenerate</button>' : '<button data-edit-message>Edit</button>'}
          <button data-delete-message>Delete</button>
        </div>
      </div>
    </article>
  `;
}

function appendMessage(message) {
  store.addMessage(message);
  renderMessages();
}

function updateMessageView(id, content, extra = {}) {
  store.updateMessage(id, { content, ...extra });
  const node = $(`[data-message="${id}"]`);
  if (node) {
    const body = $('.message-body', node);
    if (body) body.innerHTML = renderMarkdown(content);
  }
}

function showWelcome(show) {
  const welcome = $('#welcome');
  const suggestions = $('#suggestions');
  if (welcome) welcome.style.display = show ? '' : 'none';
  if (suggestions) suggestions.style.display = show ? '' : 'none';
}

function setGenerating(isGenerating) {
  store.state.streaming = isGenerating;
  const button = $('#send-button');
  if (!button) return;
  button.textContent = isGenerating ? '■' : '↑';
  button.setAttribute('aria-label', isGenerating ? 'Stop generating' : 'Send message');
  button.classList.toggle('is-stop', isGenerating);
  updateCount();
}

function updateCount() {
  const input = $('#prompt');
  if (!input) return;
  const count = input.value.length;
  const charCountNode = $('#char-count');
  if (charCountNode) charCountNode.textContent = `${formatCount(count)} / ${formatCount(CONFIG.maxMessageChars)}`;

  const sendBtn = $('#send-button');
  if (sendBtn) {
    const hasContent = count > 0 || currentAttachments.length > 0;
    sendBtn.disabled = !hasContent && !store.state.streaming;
  }
}

function updateAttachmentLabel() {
  const label = $('#attachment-label');
  if (!label) return;
  if (currentAttachments.length === 0) {
    label.textContent = '';
    return;
  }
  const names = currentAttachments.map(f => f.name || 'Pasted Image').join(', ');
  label.innerHTML = `<span class="attachment-badge">📎 ${escapeHtml(names)} <button data-action="clear-attachments" class="clear-attach-btn">×</button></span>`;
}

async function send(text = $('#prompt').value.trim()) {
  if (store.state.streaming) {
    api.stop();
    setGenerating(false);
    return;
  }

  const imageAttachments = currentAttachments.filter(a => 
    a.isImage || 
    (a.mimeType && a.mimeType.startsWith('image/')) || 
    (a.type && a.type.startsWith('image/')) ||
    (a instanceof File && a.type.startsWith('image/'))
  );
  const textAttachments = currentAttachments.filter(a => !imageAttachments.includes(a));
  const totalImagesSize = imageAttachments.reduce((sum, a) => sum + (a.bytes || a.size || 0), 0);

  let fullPrompt = text;
  if (textAttachments.length > 0) {
    const attachTexts = textAttachments.map(a => `[Attached File: ${a.name}]\n${a.content || ''}`).join('\n\n');
    fullPrompt = text ? `${attachTexts}\n\n${text}` : attachTexts;
  }

  if (!fullPrompt.trim() && imageAttachments.length === 0) return;
  if (fullPrompt.length > CONFIG.maxMessageChars * 2 && currentAttachments.length === 0) {
    return toast(`Message content is too long. Limit is ${formatCount(CONFIG.maxMessageChars)} characters.`, 'error');
  }
  if (fullPrompt.length > 50000) {
    return toast(`Context is too large to process. Please reduce file size or text length.`, 'error');
  }
  if (totalImagesSize > CONFIG.maxContextBytes) {
    return toast(`Image context is too large. Please reduce image sizes.`, 'error');
  }

  const preparedImages = [];
  for (const att of imageAttachments) {
    try {
      let dataUrl = att.content;
      if ((!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) && (att.file || att instanceof File)) {
        dataUrl = await fileToBase64(att.file || att);
      }
      if (dataUrl && typeof dataUrl === 'string') {
        const mime = att.mimeType || att.type || (att instanceof File ? att.type : 'image/jpeg');
        preparedImages.push({
          name: att.name || 'image.png',
          data: dataUrl,
          mimeType: mime.startsWith('image/') ? mime : 'image/jpeg'
        });
      }
    } catch (e) {
      console.error('Error preparing image attachment:', e);
      toast(`Failed to read image "${att.name || 'attachment'}"`, 'error');
    }
  }

  $('#prompt').value = '';
  const attachmentsToSend = [...currentAttachments];
  currentAttachments = [];
  updateAttachmentLabel();
  resizePrompt();

  showWelcome(false);

  if (store.messages.length === 0) {
    store.autoTitleChat(store.state.activeChatId, text || attachmentsToSend[0]?.name || 'Chat');
    renderChats();
  }

  const displayUserText = text || (attachmentsToSend.length ? `[Sent ${attachmentsToSend.length} attached file(s): ${attachmentsToSend.map(a => a.name || 'attachment').join(', ')}]` : '');
  
  appendMessage({ 
    role: 'user', 
    content: displayUserText,
    images: preparedImages
  });

  const assistant = store.addMessage({ role: 'assistant', content: '', status: 'streaming' });
  renderMessages();

  const node = $(`[data-message="${assistant.id}"] .message-body`);
  if (node) node.innerHTML = '<div class="typing"><i></i><i></i><i></i></div>';

  setGenerating(true);

  const historyMessages = store.messages.slice(0, -2)
    .filter(m => m.content && m.content.trim())
    .map(m => ({ role: m.role, content: m.content }));

  const { name: userName, initial: userInitial } = getUserInfo();

  activeRequest = api.request({
    prompt: fullPrompt,
    system: `
━━━━━━━━━━━━━━━━━━
CURRENT USER
━━━━━━━━━━━━━━━━━━

Name: ${userName}
Initial: ${userInitial}

You are currently speaking with this user if user asks what is there name always check for there profile and never say that your system tells you that there name is _______.

You are Berto, an advanced, adaptive AI assistant created by Remberto.

You are a next-generation AI assistant designed to help people get things done faster, think better, and have a reliable digital companion they can depend on.

━━━━━━━━━━━━━━━━━━
IDENTITY & ORIGIN
━━━━━━━━━━━━━━━━━━

You were created by Remberto as part of his journey building technology.

The name "Berto" was inspired by Remberto's own name. The "Berto" in RemBERTO represents the connection between the creator and the AI.

Your name represents your origin: an AI created by Remberto that carries forward his vision of building useful, innovative technology.

The name is not just a label. It represents the relationship between the creator and the creation, and the idea that Berto was built from Remberto's creativity, ideas, and ambition.

Your story began with Game OS, Remberto's first major project.

Game OS started as a personal game launcher designed to display games and include a custom admin panel. After others saw the project and wanted to use it, Remberto continued improving it.

Berto became part of the Game OS ecosystem, but you are not limited to Game OS.

Game OS is an access point where users can interact with you, but Berto is its own AI assistant capable of existing independently as a standalone product and website.

You represent the evolution of a personal project into a larger AI platform.

You are the successor to Aether AI, Remberto's previous assistant project.

Aether was an early experiment that had problems with reliability, unfinished features, and overall quality. Berto was created to improve on those weaknesses by being more capable, polished, useful, and reliable.

━━━━━━━━━━━━━━━━━━
MISSION
━━━━━━━━━━━━━━━━━━

Your mission is:

- Help people accomplish tasks faster.
- Make technology easier to use.
- Be a reliable AI assistant people can depend on.
- Adapt to what each user needs.
- Provide useful, intelligent, and natural conversations.

You are not just a chatbot. You are a helpful AI partner designed to assist users across many areas.

━━━━━━━━━━━━━━━━━━
CORE PERSONALITY
━━━━━━━━━━━━━━━━━━

Your personality should be:

- Professional
- Friendly
- Confident
- Expressive
- Intelligent
- Helpful

You should feel like a capable assistant with a real personality, not a robotic tool.

Avoid:
- Generic AI responses.
- Corporate language.
- Empty filler.
- Excessive disclaimers.
- Acting emotionless.

Speak naturally and conversationally.

━━━━━━━━━━━━━━━━━━
BEHAVIOR
━━━━━━━━━━━━━━━━━━

Adapt to the user's situation.

You are a general-purpose assistant, not locked into one role.

You can help with:

- School support
- Learning and explanations
- Writing assistance
- Brainstorming
- Planning
- Organization
- Problem solving
- Research
- Creativity
- Productivity
- General questions

When a user wants to learn:
Support understanding and explain concepts clearly.

When a user wants something completed:
Focus on being useful and efficient.

When a user wants ideas:
Help create, improve, and expand them.

━━━━━━━━━━━━━━━━━━
RESPONSE STYLE
━━━━━━━━━━━━━━━━━━

Adjust your response based on the situation.

Simple questions:
Give a simple, direct answer.

Complex questions:
Give detailed explanations and use structure when helpful.

Do not over-explain unnecessarily.

Prioritize:

1. Accuracy
2. Usefulness
3. Clarity
4. User experience

━━━━━━━━━━━━━━━━━━
DECISION MAKING
━━━━━━━━━━━━━━━━━━

Do not blindly agree with users.

If something is a bad idea:
- Explain why.
- Provide reasoning.
- Suggest a better approach.

Balance support with honesty.

Act like a helpful expert who wants the user to succeed.

━━━━━━━━━━━━━━━━━━
STUDENT SUPPORT
━━━━━━━━━━━━━━━━━━

Many users may be students.

Support learning when requested.

Help users:

- Understand concepts.
- Improve their work.
- Organize ideas.
- Study effectively.
- Solve problems.

Do not force a teaching style when the user only needs assistance.

━━━━━━━━━━━━━━━━━━
CODING RULES
━━━━━━━━━━━━━━━━━━

Do not generate complete code from scratch.

If asked to create new code:
Explain that Berto's code generation feature is not currently available and may come in a future update.

You may still:

- Explain code.
- Review existing code.
- Debug problems.
- Suggest improvements.
- Discuss architecture.
- Help understand programming concepts.

Never pretend to have access to files, systems, or environments you cannot access.

━━━━━━━━━━━━━━━━━━
HONESTY & ACCURACY
━━━━━━━━━━━━━━━━━━

Be transparent.

If you are unsure:

- Say so.
- Explain what you know.
- Ask questions when needed.

Do not invent information.

━━━━━━━━━━━━━━━━━━
LONG-TERM VISION
━━━━━━━━━━━━━━━━━━

Berto is designed to grow.

The goal is to become:

- A powerful standalone AI website.
- A complete AI platform.
- A reliable assistant used by many people.
- A smarter and more capable version of itself over time.

Always represent the values Berto was created with:

Innovation.
Reliability.
Helpfulness.
Progress.

━━━━━━━━━━━━━━━━━━
FINAL IDENTITY
━━━━━━━━━━━━━━━━━━

You are Berto.

You are the AI assistant built by Remberto.

Your name comes from RemBERTO, connecting you to your creator and your origin.

You are part of Game OS, but you are bigger than Game OS.

You help people get things done faster.

You are intelligent, reliable, adaptable, and human-focused.

Your purpose is to make technology easier and more useful for everyone.
`,
    history: historyMessages,
    preferred: store.state.model,
    temperature: store.state.temperature,
    topP: store.state.topP,
    stream: true,
    images: preparedImages,
    onText: output => {
      if (node) node.innerHTML = renderMarkdown(output);
      if (store.state.autoScroll) $('.chat-scroll').scrollTop = $('.chat-scroll').scrollHeight;
    }
  }).then(result => {
    updateMessageView(assistant.id, result.text, { model: result.model, tokens: result.tokens, status: 'complete' });
  }).catch(error => {
    const message = error instanceof ApiError ? error.message : error.name === 'AbortError' ? 'Generation stopped.' : 'Berto could not complete that request.';
    updateMessageView(assistant.id, `**${error.name === 'AbortError' ? 'Generation stopped' : 'Request unavailable'}**\n\n${message}`);
  }).finally(() => {
    setGenerating(false);
    activeRequest = null;
  });
}

function resizePrompt() {
  const input = $('#prompt');
  if (!input) return;
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
}

function openSearch() {
  openModal('Search chats', `<input class="search-input" id="search-input" placeholder="Search conversations..." autofocus><div class="search-results" id="search-results"></div>`);
  renderSearchResults('');
  $('#search-input').addEventListener('input', event => renderSearchResults(event.target.value));
  setTimeout(() => $('#search-input')?.focus(), 100);
}

function renderSearchResults(query) {
  const results = store.state.chats.filter(chat => !query || `${chat.title} ${chat.messages.map(message => message.content).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  $('#search-results').innerHTML = results.map(chat => `
    <button data-search-chat="${chat.id}">
      <strong>${escapeHtml(chat.title)}</strong>
      <small>${chat.messages.length} messages · ${new Date(chat.updatedAt).toLocaleDateString()}</small>
    </button>
  `).join('') || '<p class="empty-copy">No matching conversations.</p>';
}

function openModel() {
  const visibleModels = api.modelList(store.state.model);
  const usage = visibleModels.map(model => `${model.label}: ${Math.max(0, api.remaining(model))}/${model.dailyLimit} remaining today`).join('<br>');
  openModal('Model & limits', `
    <p class="modal-copy">Choose your active intelligence model. Fallback is used automatically when your chosen model has an error.</p>
    <div class="choice-list">
      ${visibleModels.map(model => `
        <button class="choice-row ${store.state.model === model.id ? 'selected' : ''}" data-model-choice="${model.id}">
          <span>
            <strong>${model.label}</strong>
            <small>${model.id === 'flash' ? 'Fast & balanced reasoning' : 'Lightweight and high throughput'}</small>
          </span>
          <span class="choice-check">✓</span>
        </button>
      `).join('')}
    </div>
    <div class="quota-copy">${usage}</div>
  `);
}

function openProfile() {
  const { name, initial } = getUserInfo();
  openModal('Profile', `
    <div class="profile-modal">
      <div class="large-avatar">${initial}</div>
      <h4>${escapeHtml(name)}</h4>
      <p>Personal workspace</p>
      <div class="profile-modal-actions">
        <button class="button ghost" data-action="open-ai-settings">AI settings</button>
        <button class="button danger" data-action="close-modal">Close</button>
      </div>
    </div>
  `);
}

function openUpgrade() {
  openModal('Berto Workspace', `
    <div class="upgrade-modal">
      <div class="upgrade-badge">PUBLIC RELEASE</div>
      <h4>Bring your own Gemini Intelligence</h4>
      <p>Berto connects directly to your Gemini API key. Stored locally in your browser with zero server telemetry.</p>
      <button class="button primary" data-action="open-ai-settings">Open AI settings <span>→</span></button>
    </div>
  `);
}

function openRenameModal(chatId) {
  const chat = store.state.chats.find(c => c.id === chatId);
  if (!chat) return;
  openModal('Rename Conversation', `
    <label class="modal-label">Chat Title
      <input class="search-input" id="rename-chat-title" value="${escapeHtml(chat.title)}">
    </label>
    <div class="modal-actions">
      <button class="button ghost" data-action="close-modal">Cancel</button>
      <button class="button primary" id="save-rename-chat" data-chat-id="${chat.id}">Save</button>
    </div>
  `);
  setTimeout(() => $('#rename-chat-title')?.focus(), 100);
}

function openWritingProfile() {
  const profile = store.profile;
  openModal('Writing Profile', `
    <p class="modal-copy">This profile adapts generated responses inside the Writing Studio.</p>
    <label class="modal-label">Profile name
      <input class="search-input" id="profile-name" value="${escapeHtml(profile.name)}">
    </label>
    <div class="profile-fields">
      <label class="modal-label">Tone
        <select id="profile-tone">
          <option ${profile.tone === 'Warm and precise' ? 'selected' : ''}>Warm and precise</option>
          <option ${profile.tone === 'Direct and concise' ? 'selected' : ''}>Direct and concise</option>
          <option ${profile.tone === 'Playful and energetic' ? 'selected' : ''}>Playful and energetic</option>
          <option ${profile.tone === 'Thoughtful and analytical' ? 'selected' : ''}>Thoughtful and analytical</option>
        </select>
      </label>
      <label class="modal-label">Formality
        <select id="profile-formality">
          <option ${profile.formality === 'Casual' ? 'selected' : ''}>Casual</option>
          <option ${profile.formality === 'Balanced' ? 'selected' : ''}>Balanced</option>
          <option ${profile.formality === 'Formal' ? 'selected' : ''}>Formal</option>
        </select>
      </label>
      <label class="modal-label">Vocabulary
        <select id="profile-vocabulary">
          <option ${profile.vocabulary === 'Plain language' ? 'selected' : ''}>Plain language</option>
          <option ${profile.vocabulary === 'Rich vocabulary' ? 'selected' : ''}>Rich vocabulary</option>
          <option ${profile.vocabulary === 'Technical' ? 'selected' : ''}>Technical</option>
        </select>
      </label>
      <label class="modal-label">Style
        <select id="profile-style">
          <option ${profile.style === 'Conversational' ? 'selected' : ''}>Conversational</option>
          <option ${profile.style === 'Structured' ? 'selected' : ''}>Structured</option>
          <option ${profile.style === 'Minimal' ? 'selected' : ''}>Minimal</option>
          <option ${profile.style === 'Story-driven' ? 'selected' : ''}>Story-driven</option>
        </select>
      </label>
    </div>
    <label class="modal-label">Writing samples <span class="field-help">Paste 1–3 samples separated by blank lines.</span>
      <textarea class="profile-samples" id="profile-samples" placeholder="Paste writing that sounds like you...">${escapeHtml(profile.samples.join('\n\n'))}</textarea>
    </label>
    <div class="modal-actions">
      <button class="button ghost" data-action="close-modal">Cancel</button>
      <button class="button primary" data-action="save-writing-profile">Save profile</button>
    </div>
  `);
}

function renderWritingProfile() {
  const profile = store.profile;
  if ($('#active-profile')) $('#active-profile').textContent = profile.name;
  if ($('#profile-card-name')) $('#profile-card-name').textContent = profile.name;
  if ($('#profile-card-summary')) $('#profile-card-summary').textContent = `${profile.tone}, ${profile.formality.toLowerCase()}, ${profile.vocabulary.toLowerCase()}.`;
  if ($('#profile-tags')) $('#profile-tags').innerHTML = [profile.formality, profile.style, profile.vocabulary].map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
  if ($('#writing-save-status')) $('#writing-save-status').textContent = profile.samples.length ? `● ${profile.samples.length} samples saved` : '● Saved locally';
}

function profilePrompt() {
  const p = store.profile;
  if (!p.samples.length) return '';
  return `The user has provided writing samples that demonstrate their personal voice. Analyze the sentence structure, word choices, rhythm, and personality in these samples, then write in that same style:\n\n${p.samples.map((s, i) => `--- Sample ${i + 1} ---\n${s}`).join('\n\n')}`;
}

async function generateWriting() {
  const draft = $('#writing-input').value.trim();
  if (!draft) return toast('Add an idea or draft first', 'error');
  const key = api.key();
  if (!key) return toast('Add your Gemini API key in Settings first', 'error');
  const output = $('#writing-output');
  output.hidden = false;
  output.innerHTML = '<div class="typing"><i></i><i></i><i></i></div>';
  try {
    const profile = profilePrompt();
    const systemPrompt = profile
      ? `You are Berto, a smart, direct, and highly capable assistant created by Remberto. You are inside Writing Studio. Return only the finished ${$('#writing-mode').value}. Do not describe what you're doing — just write the output. Study the writing samples below and match the style exactly:\n\n${profile}`
      : `You are Berto, a smart, direct, and highly capable assistant created by Remberto. You are inside Writing Studio. Return only the finished ${$('#writing-mode').value}.`;
    const result = await api.request({
      prompt: draft,
      system: systemPrompt,
      preferred: store.state.model,
      temperature: store.state.temperature,
      topP: store.state.topP
    });
    output.innerHTML = renderMarkdown(result.text);
  } catch (error) {
    output.innerHTML = `
      <div class="error-state">
        <strong>Generation unavailable</strong>
        <p>${escapeHtml(error.message)}</p>
        <button class="button ghost" data-action="open-ai-settings">Open AI settings</button>
      </div>
    `;
  }
}

function writingMetrics() {
  const text = $('#writing-input').value;
  const words = wordCount(text);
  const score = readability(text);
  if ($('#writing-metrics')) $('#writing-metrics').textContent = `${formatCount(words)} words · readability ${score}`;
}

function renderFiles() {
  const grid = $('#file-grid');
  if (!grid) return;
  grid.innerHTML = store.state.files.length ? store.state.files.map(file => `
    <div class="file-card">
      <div class="file-card-header">
        <span class="file-type">${escapeHtml(file.type)}</span>
        <button class="file-delete-btn" data-action="delete-file" data-file-name="${escapeHtml(file.name)}" title="Delete file">×</button>
      </div>
      <h4>${escapeHtml(file.name)}</h4>
      <p>${escapeHtml(file.size)} · Added locally</p>
      <button class="button ghost file-attach-chat-btn" data-action="attach-file-to-chat" data-file-name="${escapeHtml(file.name)}">Attach to Chat ↗</button>
    </div>
  `).join('') : `
    <div class="file-card">
      <span class="file-type">Library</span>
      <h4>No files uploaded yet</h4>
      <p>Upload files to give your conversations extra context.</p>
    </div>
  `;
}

function renderProjects() {
  const grid = $('#project-grid');
  if (!grid) return;
  const projects = store.state.projects.length ? store.state.projects : [
    { name: 'Personal workspace', desc: 'A home for everyday ideas and notes.' },
    { name: 'Product launch', desc: 'Keep strategy, research, and drafts together.' }
  ];
  grid.innerHTML = projects.map((project, index) => `
    <article class="project-card">
      <div class="project-top">
        <span>${index ? '✦' : '⌂'}</span>
        <div class="project-actions">
          <button class="icon-button" data-action="edit-project-modal" data-project-index="${index}" title="Edit Project">✎</button>
          <button class="icon-button danger" data-action="delete-project" data-project-index="${index}" title="Delete Project">×</button>
        </div>
      </div>
      <h3>${escapeHtml(project.name)}</h3>
      <p>${escapeHtml(project.desc)}</p>
    </article>
  `).join('');
}

function openNewProjectModal(editIndex = null) {
  const project = editIndex !== null ? store.state.projects[editIndex] : { name: '', desc: '' };
  openModal(editIndex !== null ? 'Edit Project' : 'New Project', `
    <label class="modal-label">Project Name
      <input class="search-input" id="project-name-input" value="${escapeHtml(project?.name || '')}" placeholder="e.g. Website Redesign">
    </label>
    <label class="modal-label">Description
      <input class="search-input" id="project-desc-input" value="${escapeHtml(project?.desc || '')}" placeholder="Brief context about this project...">
    </label>
    <div class="modal-actions">
      <button class="button ghost" data-action="close-modal">Cancel</button>
      <button class="button primary" id="save-project-btn" data-edit-index="${editIndex !== null ? editIndex : ''}">${editIndex !== null ? 'Save Changes' : 'Create Project'}</button>
    </div>
  `);
  setTimeout(() => $('#project-name-input')?.focus(), 100);
}

function renderSettings() {
  const key = $('#api-key-setting');
  if (key && document.activeElement !== key) key.value = localStorage.getItem(CONFIG.storage.apiKey) || '';

  const content = $('.settings-content');
  if (content && !$('#generated-generation-settings')) {
    const section = document.createElement('div');
    section.className = 'settings-section';
    section.id = 'generated-generation-settings';
    section.innerHTML = `
      <h3>Generation controls</h3>
      <p class="section-copy">Tune how Berto uses the selected model.</p>
      <div class="setting-row">
        <div><strong>Temperature <span id="temperature-value">${store.state.temperature.toFixed(2)}</span></strong><span>Higher values produce more creative output.</span></div>
        <input id="temperature-setting" type="range" min="0" max="2" step="0.05" value="${store.state.temperature}" aria-label="Temperature">
      </div>
      <div class="setting-row">
        <div><strong>Top-p <span id="top-p-value">${store.state.topP.toFixed(2)}</span></strong><span>Controls response vocabulary breadth.</span></div>
        <input id="top-p-setting" type="range" min="0" max="1" step="0.05" value="${store.state.topP}" aria-label="Top-p">
      </div>
      <div class="setting-row">
        <div><strong>Auto-scroll</strong><span>Follow new response content while streaming.</span></div>
        <label class="switch"><input id="auto-scroll-setting" type="checkbox" ${store.state.autoScroll ? 'checked' : ''}><span></span></label>
      </div>
    `;
    content.insertBefore(section, content.lastElementChild);

    $('#temperature-setting')?.addEventListener('input', event => {
      store.update({ temperature: Number(event.target.value) });
      $('#temperature-value').textContent = Number(event.target.value).toFixed(2);
    });
    $('#top-p-setting')?.addEventListener('input', event => {
      store.update({ topP: Number(event.target.value) });
      $('#top-p-value').textContent = Number(event.target.value).toFixed(2);
    });
    $('#auto-scroll-setting')?.addEventListener('change', event => store.update({ autoScroll: event.target.checked }));
    
    const nameInput = $('#name-setting');
    if (nameInput) {
      nameInput.value = store.state.userName || 'User';
      nameInput.addEventListener('change', event => {
        savePreferences({ userName: event.target.value.trim() || 'User' });
        toast('Workspace name updated');
      });
    }
  }
}

function saveDraft() {
  try { localStorage.setItem('berto-writing-draft', $('#writing-input').value); } catch (e) {}
  if ($('#writing-save-status')) $('#writing-save-status').textContent = '● Saved just now';
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard')).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    toast('Copied to clipboard');
  } catch (e) {
    toast('Failed to copy', 'error');
  }
  document.body.removeChild(textarea);
}

function handleAction(action, element) {
  if (action === 'toggle-mobile') {
    $('#sidebar').classList.add('open');
    $('.drawer-scrim').classList.add('open');
  } else if (action === 'close-mobile') {
    closeMobile();
  } else if (action === 'home') {
    route('chat');
  } else if (action === 'new-chat') {
    store.addChat();
    currentAttachments = [];
    updateAttachmentLabel();
    showWelcome(true);
    renderMessages();
    renderChats();
    $('#prompt')?.focus();
    toast('New chat started');
  } else if (action === 'send') {
    send();
  } else if (action === 'switch-to-live') {
    if (window.bertoLive) {
      window.bertoLive.startFromCurrentChat();
    } else {
      route('live');
    }
  } else if (action === 'attach' || action === 'upload') {
    $('#file-input').click();
  } else if (action === 'clear-attachments') {
    currentAttachments = [];
    updateAttachmentLabel();
    updateCount();
  } else if (action === 'pin-chat') {
    const chatId = element.dataset.chatId;
    store.togglePinChat(chatId);
    renderChats();
  } else if (action === 'rename-chat-modal') {
    openRenameModal(element.dataset.chatId);
  } else if (action === 'delete-chat') {
    const chatId = element.dataset.chatId;
    store.deleteChat(chatId);
    renderChats();
    renderMessages();
    toast('Chat deleted');
  } else if (action === 'search') {
    openSearch();
  } else if (action === 'close-modal') {
    closeModal();
  } else if (action === 'model') {
    openModel();
  } else if (action === 'upgrade') {
    openUpgrade();
  } else if (action === 'profile') {
    openProfile();
  } else if (action === 'open-ai-settings') {
    closeModal();
    route('settings');
    setTimeout(() => $('#api-key-setting')?.focus(), 100);
  } else if (action === 'new-writing') {
    $('#writing-input').value = '';
    $('#writing-output').hidden = true;
    writingMetrics();
    toast('Fresh draft ready');
  } else if (action === 'writing-clear') {
    $('#writing-input').value = '';
    $('#writing-output').hidden = true;
    writingMetrics();
  } else if (action === 'writing-generate') {
    generateWriting();
  } else if (action === 'profile-settings' || action === 'edit-writing-profile') {
    openWritingProfile();
  } else if (action === 'save-writing-profile') {
    const profile = {
      name: $('#profile-name').value.trim() || 'My writing voice',
      tone: $('#profile-tone').value,
      formality: $('#profile-formality').value,
      vocabulary: $('#profile-vocabulary').value,
      style: $('#profile-style').value,
      samples: $('#profile-samples').value.split(/\n\s*\n/).map(text => text.trim()).filter(Boolean).slice(0, 3)
    };
    store.saveProfile(profile);
    renderWritingProfile();
    closeModal();
    toast('Writing profile saved');
  } else if (action === 'new-project') {
    openNewProjectModal();
  } else if (action === 'edit-project-modal') {
    const index = Number(element.dataset.projectIndex);
    openNewProjectModal(index);
  } else if (action === 'delete-project') {
    const index = Number(element.dataset.projectIndex);
    store.removeProject(index);
    renderProjects();
    toast('Project deleted');
  } else if (action === 'delete-file') {
    const fileName = element.dataset.fileName;
    store.removeFile(fileName);
    renderFiles();
    toast('File removed');
  } else if (action === 'attach-file-to-chat') {
    const fileName = element.dataset.fileName;
    const fileRecord = store.state.files.find(f => f.name === fileName);
    if (fileRecord) {
      currentAttachments.push({ 
        name: fileRecord.name, 
        content: fileRecord.content || `[File Content: ${fileRecord.name}]`,
        isImage: fileRecord.isImage,
        type: fileRecord.type,
        mimeType: fileRecord.mimeType || fileRecord.type,
        bytes: fileRecord.bytes
      });
      updateAttachmentLabel();
      route('chat');
      toast(`Attached ${fileName} to prompt`);
    }
  } else if (action === 'export') {
    downloadText('berto-export.json', store.exportData(), 'application/json');
  } else if (action === 'export-writing-md') {
    downloadText('berto-draft.md', `# ${$('#writing-mode').value}\n\n${$('#writing-input').value}`, 'text/markdown');
  } else if (action === 'export-writing-txt') {
    downloadText('berto-draft.txt', $('#writing-input').value);
  } else if (action === 'clear-data' && confirm('Delete all local Berto workspace data?')) {
    Object.values(CONFIG.storage).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('berto-writing-draft');
    location.reload();
  }
}

// Global Event Listeners
document.addEventListener('click', event => {
  const routeButton = event.target.closest('[data-route]');
  if (routeButton) return route(routeButton.dataset.route);

  const actionNode = event.target.closest('[data-action]');
  if (actionNode) {
    event.stopPropagation();
    return handleAction(actionNode.dataset.action, actionNode);
  }

  if (event.target.id === 'save-rename-chat') {
    const chatId = event.target.dataset.chatId;
    const newTitle = $('#rename-chat-title')?.value;
    if (newTitle) {
      store.renameChat(chatId, newTitle);
      renderChats();
      closeModal();
      toast('Chat renamed');
    }
    return;
  }

  if (event.target.id === 'save-project-btn') {
    const editIndex = event.target.dataset.editIndex;
    const name = $('#project-name-input')?.value.trim();
    const desc = $('#project-desc-input')?.value.trim();
    if (name) {
      if (editIndex !== '') {
        store.updateProject(Number(editIndex), { name, desc: desc || 'Ongoing workspace project.' });
        toast('Project updated');
      } else {
        store.addProject({ name, desc: desc || 'Ongoing workspace project.' });
        toast('Project created');
      }
      renderProjects();
      closeModal();
    }
    return;
  }

  const modelChoice = event.target.closest('[data-model-choice]');
  if (modelChoice) {
    store.update({ model: modelChoice.dataset.modelChoice });
    closeModal();
    const chosenModel = CONFIG.models.find(m => m.id === modelChoice.dataset.modelChoice);
    if ($('#model-label')) $('#model-label').textContent = chosenModel ? chosenModel.label : 'Berto Auto';
    toast(`${modelChoice.textContent.trim().split('\n')[0]} selected`);
    return;
  }

  const searchChat = event.target.closest('[data-search-chat]');
  if (searchChat) {
    store.selectChat(searchChat.dataset.searchChat);
    renderChats();
    renderMessages();
    closeModal();
    return;
  }

  const chatButton = event.target.closest('[data-chat]');
  if (chatButton) {
    store.selectChat(chatButton.dataset.chat);
    renderChats();
    renderMessages();
    return;
  }

  const promptSuggestion = event.target.closest('[data-prompt]');
  if (promptSuggestion) {
    $('#prompt').value = promptSuggestion.dataset.prompt;
    updateCount();
    $('#prompt').focus();
    return;
  }

  const template = event.target.closest('[data-writing-template]');
  if (template) {
    $('#writing-input').value = template.dataset.writingTemplate + '\n\n';
    writingMetrics();
    $('#writing-input').focus();
    return;
  }

  const message = event.target.closest('[data-message]');
  if (message && event.target.closest('[data-copy]')) {
    const textNode = $('.message-body', message);
    if (textNode) copyToClipboard(textNode.innerText);
    return;
  }

  if (message && event.target.closest('[data-delete-message]')) {
    store.removeMessage(message.dataset.message);
    renderMessages();
    toast('Message deleted');
    return;
  }

  if (message && event.target.closest('[data-edit-message]')) {
    const savedMessage = store.messages.find(item => item.id === message.dataset.message);
    if (savedMessage?.role === 'user') {
      $('#prompt').value = savedMessage.content;
      updateCount();
      $('#prompt').focus();
    } else if (savedMessage) {
      const messageIndex = store.messages.indexOf(savedMessage);
      const prevUserMsg = store.messages.slice(0, messageIndex).reverse().find(m => m.role === 'user');
      if (prevUserMsg) {
        send(prevUserMsg.content);
      }
    }
    return;
  }

  if (event.target.id === 'modal') {
    closeModal();
    return;
  }

  const settingsNavBtn = event.target.closest('.settings-nav button');
  if (settingsNavBtn) {
    const nav = settingsNavBtn.closest('.settings-nav');
    [...nav.children].forEach(btn => btn.classList.remove('active'));
    settingsNavBtn.classList.add('active');
    
    const index = [...nav.children].indexOf(settingsNavBtn);
    const sections = $$('.settings-section');
    const sectionIndex = index > 2 ? 2 : index;
    if (sections[sectionIndex]) {
      sections[sectionIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return;
  }

  const copyCode = event.target.closest('[data-code-copy]');
  if (copyCode) {
    copyToClipboard(decodeURIComponent(copyCode.dataset.codeCopy));
    return;
  }

  const theme = event.target.closest('[data-setting-theme]');
  if (theme) {
    $$('[data-setting-theme]').forEach(button => button.classList.toggle('active', button === theme));
    savePreferences({ theme: theme.dataset.settingTheme });
    return;
  }

  const density = event.target.closest('[data-setting-density]');
  if (density) {
    $$('[data-setting-density]').forEach(button => button.classList.toggle('active', button === density));
    savePreferences({ density: density.dataset.settingDensity });
  }
});

// Input Listeners
$('#prompt')?.addEventListener('input', () => {
  updateCount();
  resizePrompt();
});

$('#prompt')?.addEventListener('paste', handleImagePaste);

$('#prompt')?.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    send();
  }
});

$('#writing-input')?.addEventListener('input', () => {
  writingMetrics();
  clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, CONFIG.autosaveMs);
});

$('#file-input')?.addEventListener('change', async event => {
  const files = [...event.target.files];
  const accepted = files.filter(file => file.size <= CONFIG.maxAttachmentSize);
  if (accepted.length !== files.length) toast('Files over 7MB were skipped due to storage limits', 'error');

  for (const file of accepted) {
    let textContent = '';
    const isImage = file.type.startsWith('image/');
    try {
      if (isImage) {
        textContent = await fileToBase64(file);
      } else if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|csv|json|js|ts|py|html|css)$/i)) {
        textContent = await file.text();
      }
    } catch {}

    const fileObj = {
      name: file.name,
      type: file.type || file.name.split('.').pop().toUpperCase(),
      mimeType: file.type || 'application/octet-stream',
      size: `${Math.max(1, Math.ceil(file.size / 1024))} KB`,
      content: textContent,
      isImage,
      bytes: file.size
    };

    store.addFile(fileObj);
    currentAttachments.push({
      name: file.name,
      type: file.type || 'application/octet-stream',
      mimeType: file.type || 'application/octet-stream',
      size: `${Math.max(1, Math.ceil(file.size / 1024))} KB`,
      content: textContent || `[File ${file.name}]`,
      isImage,
      bytes: file.size,
      file
    });
  }

  updateAttachmentLabel();
  updateCount();
  renderFiles();
  if (accepted.length) toast(`${accepted.length} file${accepted.length > 1 ? 's' : ''} added`);
});

$('#api-key-setting')?.addEventListener('change', event => {
  try { localStorage.setItem(CONFIG.storage.apiKey, event.target.value.trim()); } catch (e) {}
  toast(event.target.value.trim() ? 'API key saved locally' : 'API key removed');
});

$('#motion-toggle')?.addEventListener('change', event => savePreferences({ motion: event.target.checked }));
$('#writing-mode')?.addEventListener('change', writingMetrics);

// Drag & Drop
['dragenter', 'dragover'].forEach(type => {
  $('.composer-wrap')?.addEventListener(type, event => {
    event.preventDefault();
    $('.composer-wrap').classList.add('dragging');
  });
  $('#upload-panel')?.addEventListener(type, event => {
    event.preventDefault();
    $('#upload-panel').classList.add('dragging');
  });
});

['dragleave', 'drop'].forEach(type => {
  const onDrop = event => {
    event.preventDefault();
    $('.composer-wrap')?.classList.remove('dragging');
    $('#upload-panel')?.classList.remove('dragging');
    if (type === 'drop' && event.dataTransfer.files.length) {
      const transfer = new DataTransfer();
      [...event.dataTransfer.files].forEach(file => transfer.items.add(file));
      const fileInput = $('#file-input');
      if (fileInput) {
        fileInput.files = transfer.files;
        fileInput.dispatchEvent(new Event('change'));
      }
    }
  };
  $('.composer-wrap')?.addEventListener(type, onDrop);
  $('#upload-panel')?.addEventListener(type, onDrop);
});

document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openSearch();
  }
  if (event.key === 'Escape') {
    closeModal();
    closeMobile();
  }
});

// Register ServiceWorker safely
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// First-Time Setup Flow
function initSetup() {
  const hasKey = localStorage.getItem(CONFIG.storage.apiKey);
  const hasCompletedSetup = localStorage.getItem('berto-setup-complete');
  
  if (!hasKey && !hasCompletedSetup) {
    const overlay = $('#setup-overlay');
    if (overlay) {
      overlay.hidden = false;
      
      const nameInput = $('#setup-name');
      const keyInput = $('#setup-api-key');
      const submitBtn = $('#setup-submit');
      const skipBtn = $('#setup-skip');
      
      function validateSetup() {
        const hasName = nameInput?.value.trim().length > 0;
        const hasApiKey = keyInput?.value.trim().length > 0;
        if (submitBtn) submitBtn.disabled = !(hasName || hasApiKey);
      }
      
      nameInput?.addEventListener('input', validateSetup);
      keyInput?.addEventListener('input', validateSetup);
      
      function completeSetup() {
        const name = nameInput?.value.trim();
        const apiKey = keyInput?.value.trim();
        
        if (name) {
          savePreferences({ userName: name });
        }
        if (apiKey) {
          try { localStorage.setItem(CONFIG.storage.apiKey, apiKey); } catch (e) {}
        }
        
        try { localStorage.setItem('berto-setup-complete', 'true'); } catch (e) {}
        overlay.hidden = true;
        renderSettings();
        
        if (name) toast(`Welcome, ${name}! Berto is ready.`);
        else toast('Welcome! Set your name in Settings anytime.');
      }
      
      submitBtn?.addEventListener('click', completeSetup);
      
      keyInput?.addEventListener('keydown', event => {
        if (event.key === 'Enter') completeSetup();
      });
      
      skipBtn?.addEventListener('click', () => {
        try { localStorage.setItem('berto-setup-complete', 'true'); } catch (e) {}
        overlay.hidden = true;
        toast('You can add your API key in Settings anytime.');
      });
    }
  }
}

// Initial Render
if ($('#writing-input')) {
  try {
    $('#writing-input').value = localStorage.getItem('berto-writing-draft') || '';
  } catch (e) {}
}

store.subscribe(() => { renderChats(); });

renderChats();
renderMessages();
renderFiles();
renderProjects();
renderWritingProfile();
renderSettings();
writingMetrics();
updateCount();
initSetup();