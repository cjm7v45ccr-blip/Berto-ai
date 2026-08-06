// Berto Chat UI, Prompt Input & Streaming

let cameraStream = null;
let capturedPhotoBlob = null;
let activeSpeakingMsgId = null;

function route(routeName) {
  if (!routeName) routeName = 'chat';
  
  // 1. Save route to local store
  store.update({ route: routeName });

  // 2. Toggle active view sections & nav buttons
  $$('.view').forEach(view => view.classList.toggle('active', view.dataset.view === routeName));
  $$('.nav-item[data-route]').forEach(button => button.classList.toggle('active', button.dataset.route === routeName));

  // 3. Update breadcrumb header
  const routeLabels = { chat: 'Chats', writing: 'Writing Studio', files: 'Files', voice: 'Voice', settings: 'Settings' };
  if ($('#breadcrumb')) $('#breadcrumb').textContent = routeLabels[routeName] || routeName[0].toUpperCase() + routeName.slice(1);
  
  closeMobile();

  // 4. Render specific view views
  if (routeName === 'files') renderFiles();
  if (routeName === 'settings') renderSettings();
  if (routeName === 'voice') initVoiceView();

  // 5. Update browser address bar hash (#settings, #writing, etc.)
  if (window.location.hash.slice(1) !== routeName) {
    history.replaceState(null, '', `#${routeName}`);
  }
}

function closeMobile() {
  $('#sidebar')?.classList.remove('open');
  $('.drawer-scrim')?.classList.remove('open');
}

function renderChats(filter = '') {
  const chats = store.state.chats.filter(chat => !chat.archived && (!filter || chat.title.toLowerCase().includes(filter.toLowerCase())));
  chats.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const listEl = $('#chat-list');
  if (!listEl) return;

  listEl.innerHTML = chats.map(chat => `
    <div class="chat-item-wrapper ${chat.id === store.state.activeChatId ? 'active' : ''}">
      <!-- Chat Item -->
      <button class="chat-item ${chat.id === store.state.activeChatId ? 'active' : ''}" data-chat="${chat.id}">
        ${chat.pinned ? `<span class="pinned-indicator" title="Pinned chat"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>` : ''}
        <span class="chat-title-text">${escapeHtml(chat.title)}</span>
      </button>

      <!-- Hover Action Buttons (Right Side Only) -->
      <div class="chat-item-actions">
        <button class="chat-action-btn ${chat.pinned ? 'is-pinned' : ''}" data-action="pin-chat" data-chat-id="${chat.id}" title="${chat.pinned ? 'Unpin chat' : 'Pin chat'}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="${chat.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
        <button class="chat-action-btn" data-action="rename-chat-modal" data-chat-id="${chat.id}" title="Rename">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </button>
        <button class="chat-action-btn danger" data-action="delete-chat" data-chat-id="${chat.id}" title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
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
  if (!box) return;
  const msgs = store.messages;
  showWelcome(msgs.length === 0);
  box.innerHTML = msgs.map(message => messageMarkup(message)).join('');
  
  if (window.hljs) {
    box.querySelectorAll('pre code').forEach((block) => {
      window.hljs.highlightElement(block);
    });
  }
  
  box.querySelectorAll('[data-message]').forEach(node => node.classList.add('is-ready'));
  if (store.state.autoScroll && $('.chat-scroll')) $('.chat-scroll').scrollTop = $('.chat-scroll').scrollHeight;
}

function stripMarkdownForSpeech(md = '') {
  return md
    .replace(/```[\s\S]*?```/g, ' [code block omitted] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[#*_\-~>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resetReadAloudButtons() {
  activeSpeakingMsgId = null;
  document.querySelectorAll('[data-action="read-aloud"]').forEach(btn => {
    btn.classList.remove('is-reading');
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg><span>Read aloud</span>`;
  });
}

async function toggleReadAloud(messageId, buttonNode) {
  if (voiceEngineInstance && (voiceEngineInstance.isSpeaking || activeSpeakingMsgId === messageId)) {
    voiceEngineInstance.cancelSpeaking();
    voiceEngineInstance.stopListening();
    resetReadAloudButtons();
    toast('Stopped reading', 'info');
    return;
  }

  const msg = store.messages.find(m => m.id === messageId);
  if (!msg || !msg.content) return;

  const cleanText = stripMarkdownForSpeech(msg.content);
  if (!cleanText) return;

  const key = localStorage.getItem(CONFIG.storage.apiKey)?.trim();
  if (!key) {
    toast('Add your Gemini API key in Settings to use Berto Live Voice.', 'error');
    return;
  }

  if (!voiceEngineInstance) {
    initVoiceView();
  }

  resetReadAloudButtons();
  activeSpeakingMsgId = messageId;

  if (buttonNode) {
    buttonNode.classList.add('is-reading');
    buttonNode.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color:var(--accent);"><rect x="6" y="6" width="12" height="12" rx="2"/></svg><span>Stop</span>`;
  }

  toast('Streaming Berto Live Voice...', 'info');

  try {
    if (!voiceEngineInstance.isListening) {
      await voiceEngineInstance.startListening({ enableMicrophone: false });
    }

    voiceEngineInstance.sendTextPrompt(
      `Read the following text out loud word-for-word cleanly and naturally. Do not add any extra intro, preamble, or commentary:\n\n${cleanText}`
    );
  } catch (err) {
    console.error('Berto Live Voice Read Aloud error:', err);
    toast('Failed to connect to Berto Live Voice', 'error');
    resetReadAloudButtons();
  }
}

function messageMarkup(message) {
  const isUser = message.role === 'user';
  const { initial: userInitial } = getUserInfo();

  const assistantAvatarHtml = `<img src="./assets/logo.png" alt="Berto" class="assistant-avatar-img">`;

  const hasHtml = !isUser && message.content && /```html/i.test(message.content);
  const artifactBtn = hasHtml ? `<button data-action="open-msg-artifact" style="color:var(--accent,#82f3d0); font-weight:600;" class="btn-flex"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg><span>Open Artifact</span></button>` : '';
  const meta = message.model
    ? `<div class="message-meta">${escapeHtml(message.model)}${message.tokens ? ` · ${formatCount(message.tokens)} tokens` : ''}</div>`
    : '';

  const imagesHtml = message.images?.length
    ? `<div class="message-images">${message.images.map(img => `<img src="${escapeHtml(img.data)}" alt="${escapeHtml(img.name || 'image')}">`).join('')}</div>`
    : '';

  const filesHtml = message.files?.length
    ? `<div class="message-files">${message.files.map(file => `
        <div class="message-file-chip">
          <span class="file-chip-icon">${getFileIconSvg(file.name || file.type)}</span>
          <div class="file-chip-info">
            <span class="file-chip-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
            <span class="file-chip-size">${escapeHtml(file.size || file.type || 'File')}</span>
          </div>
        </div>
      `).join('')}</div>`
    : '';

  const readAloudBtn = !isUser ? `
    <button data-action="read-aloud" data-message-id="${message.id}" title="Read response with Berto Live Voice" class="btn-flex ${activeSpeakingMsgId === message.id ? 'is-reading' : ''}">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="${activeSpeakingMsgId === message.id ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${activeSpeakingMsgId === message.id 
          ? '<rect x="6" y="6" width="12" height="12" rx="2"/>' 
          : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'}
      </svg>
      <span>${activeSpeakingMsgId === message.id ? 'Stop' : 'Read aloud'}</span>
    </button>
  ` : '';

  return `
    <article class="message ${isUser ? 'user' : 'assistant'}" data-message="${message.id}">
      <div class="message-avatar">${isUser ? userInitial : assistantAvatarHtml}</div>
      <div class="message-stack">
        ${imagesHtml}
        ${filesHtml}
        <div class="message-body">${typeof renderMarkdownEnhanced === 'function' ? renderMarkdownEnhanced(stripJsonActions(message.content || '')) : renderMarkdown(stripJsonActions(message.content || ''))}</div>
        ${meta}
        <div class="message-actions">
          ${artifactBtn}
          ${readAloudBtn}
          <button data-action="fork-chat" data-message-id="${message.id}" title="Fork chat from here" class="btn-flex">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" y1="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
            <span>Fork</span>
          </button>
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
    if (body) body.innerHTML = typeof renderMarkdownEnhanced === 'function' ? renderMarkdownEnhanced(stripJsonActions(content)) : renderMarkdown(stripJsonActions(content));
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

  button.innerHTML = isGenerating
    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;

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
  label.innerHTML = `
    <span class="attachment-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> 
      ${escapeHtml(names)} 
      <button data-action="clear-attachments" class="clear-attach-btn" aria-label="Remove attachments">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </span>`;
}

function resizePrompt() {
  const input = $('#prompt');
  if (!input) return;
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
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
          const base64Data = await compressImage(file);
          
          currentAttachments.push({
            name: file.name || `pasted_image_${Date.now()}.jpg`,
            type: 'image/jpeg',
            mimeType: 'image/jpeg',
            size: `Compressed`,
            bytes: Math.round(base64Data.length * 0.75),
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

async function openCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  
  const modal = $('#camera-modal');
  const video = $('#camera-video');
  const canvas = $('#camera-canvas');
  const captureBtn = $('#capture-btn');
  const retakeBtn = $('#retake-btn');

  if (!modal || !video) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    cameraStream = stream;
    video.srcObject = stream;
    modal.hidden = false;
    if (captureBtn) captureBtn.hidden = false;
    if (retakeBtn) retakeBtn.hidden = true;
    if (canvas) canvas.hidden = true;
    video.hidden = false;
  } catch (error) {
    toast('Unable to access camera. Please allow camera permissions.', 'error');
    console.error('Camera access error:', error);
  }
}

function closeCameraModal() {
  const modal = $('#camera-modal');
  const video = $('#camera-video');

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  if (video) {
    video.srcObject = null;
  }
  if (modal) modal.hidden = true;
  capturedPhotoBlob = null;
}

function capturePhoto() {
  const video = $('#camera-video');
  const canvas = $('#camera-canvas');
  const captureBtn = $('#capture-btn');
  const retakeBtn = $('#retake-btn');
  const sendBtn = $('#send-camera-btn');

  if (!video || !canvas) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    capturedPhotoBlob = blob;
    if (captureBtn) captureBtn.hidden = true;
    if (retakeBtn) retakeBtn.hidden = false;
    if (sendBtn) {
      sendBtn.hidden = false;
      sendBtn.style.display = 'inline-flex';
    }
    video.hidden = true;
    canvas.hidden = false;
    toast('Photo captured! Click "Send to chat" to save.');
  }, 'image/jpeg', 0.92);
}

function retakePhoto() {
  const video = $('#camera-video');
  const canvas = $('#camera-canvas');
  const captureBtn = $('#capture-btn');
  const retakeBtn = $('#retake-btn');
  const sendBtn = $('#send-camera-btn');

  if (captureBtn) captureBtn.hidden = false;
  if (retakeBtn) retakeBtn.hidden = true;
  if (sendBtn) sendBtn.hidden = true;
  if (video) video.hidden = false;
  if (canvas) canvas.hidden = true;
  capturedPhotoBlob = null;
}

async function sendCameraPhoto() {
  if (!capturedPhotoBlob) return;

  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(capturedPhotoBlob);
    });

    const fileName = `camera_${Date.now()}.jpg`;
    
    store.addFile({
      name: fileName,
      type: 'image/jpeg',
      mimeType: 'image/jpeg',
      size: `${Math.max(1, Math.ceil(capturedPhotoBlob.size / 1024))} KB`,
      content: dataUrl,
      isImage: true,
      bytes: capturedPhotoBlob.size
    });

    currentAttachments.push({
      name: fileName,
      type: 'image/jpeg',
      mimeType: 'image/jpeg',
      size: `${Math.max(1, Math.ceil(capturedPhotoBlob.size / 1024))} KB`,
      bytes: capturedPhotoBlob.size,
      content: dataUrl,
      isImage: true,
      file: new File([capturedPhotoBlob], fileName, { type: 'image/jpeg' })
    });

    capturedPhotoBlob = null;
    closeCameraModal();
    updateAttachmentLabel();
    updateCount();
    renderFiles();
    toast('Photo saved to Files and attached to message');
  } catch (e) {
    console.error('Error processing camera photo:', e);
    toast('Failed to process photo', 'error');
  }
}

function openSearch() {
  openModal('Search chats', `<input class="search-input" id="search-input" placeholder="Search conversations..." autofocus><div class="search-results" id="search-results"></div>`);
  renderSearchResults('');
  $('#search-input')?.addEventListener('input', event => renderSearchResults(event.target.value));
  setTimeout(() => $('#search-input')?.focus(), 100);
}

function renderSearchResults(query) {
  const results = store.state.chats.filter(chat => !query || `${chat.title} ${chat.messages.map(message => message.content).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const container = $('#search-results');
  if (!container) return;
  container.innerHTML = results.map(chat => `
    <button data-search-chat="${chat.id}">
      <strong>${escapeHtml(chat.title)}</strong>
      <small>${chat.messages.length} messages · ${new Date(chat.updatedAt).toLocaleDateString()}</small>
    </button>
  `).join('') || '<p class="empty-copy">No matching conversations.</p>';
}

function openModel() {
  const visibleModels = api.modelList(store.state.model);
  const usage = visibleModels.map(model => `${model.label}: ${Math.max(0, api.remaining(model))} requests remaining`).join('<br>');
  
  openModal('AI Studio Models', `
    <p class="modal-copy">Select your intelligence engine. Use <strong>Pro</strong> for complex coding architecture, and <strong>Flash</strong> for fast iterations.</p>
    <div class="choice-list">
      ${visibleModels.map(model => `
        <button class="choice-row ${store.state.model === model.id ? 'selected' : ''}" data-model-choice="${model.id}">
          <div style="display:flex; flex-direction:column; align-items:flex-start;">
            <strong style="color:var(--text); font-size:14px;">${model.label}</strong>
            <small style="color:var(--muted); font-size:11px; margin-top:4px;">${model.desc}</small>
          </div>
          <span class="choice-check">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        </button>
      `).join('')}
    </div>
    <div class="quota-copy" style="margin-top:20px; font-family:monospace; color:var(--accent);">${usage}</div>
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

function openImportModal() {
  openModal('Import Workspace Backup', `
    <p class="modal-copy">Select or drop a <code>.json</code> backup file exported from Berto AI Workspace to restore your conversations, profile, and files.</p>
    <div id="import-drop-zone" style="border: 2px dashed var(--border, #333); padding: 30px; text-align: center; border-radius: 8px; cursor: pointer; margin-top: 12px;">
      <p style="margin: 0;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Drop your <strong>.json</strong> file here or click to browse</p>
      <input type="file" id="import-file-input" accept=".json" hidden>
    </div>
  `);

  const dropZone = $('#import-drop-zone');
  const fileInput = $('#import-file-input');

  dropZone?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const text = await file.text();
      if (store.importData(text)) closeModal();
    }
  });
}

function openUpgrade() {
  openModal('Berto Workspace', `
    <div class="upgrade-modal">
      <div class="upgrade-badge">PUBLIC RELEASE</div>
      <h4>Bring your own Gemini Intelligence</h4>
      <p>Berto connects directly to your Gemini API key. Stored locally in your browser with zero server telemetry.</p>
      <button class="button primary" data-action="open-ai-settings">Open AI settings <span><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg></span></button>
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