// Berto Custom Personas & SVG Icon Manager

const GEM_SVG_ICONS = {
  zap: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  code: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  cap: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  palette: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.5-.72 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z"/></svg>`,
  bot: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`,
  brain: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 5v13"/></svg>`,
  terminal: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 12 4 6"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
  sparkles: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  wrench: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
};

const BUILTIN_GEMS = [
  {
    id: 'default',
    name: 'Berto (Autonomous)',
    iconKey: 'zap',
    description: 'Default workspace intelligence',
    systemPrompt: ''
  },
  {
    id: 'engineer',
    name: 'Senior Software Engineer',
    iconKey: 'code',
    description: 'Scalable architecture & clean code',
    systemPrompt: 'You are an expert Senior Software Architect. Provide robust, type-safe, modular, and performance-optimized code solutions with minimal conversational fluff.'
  },
  {
    id: 'editor',
    name: 'Strict Copy Editor',
    iconKey: 'edit',
    description: 'Ruthless editing for conciseness & tone',
    systemPrompt: 'You are a Strict Copy Editor. Ruthlessly analyze and refine text for maximum clarity, impact, flow, and grammatical precision. Avoid corporate jargon and generic AI idioms.'
  },
  {
    id: 'tutor',
    name: 'Socratic Tutor',
    iconKey: 'cap',
    description: 'Guided discovery learning',
    systemPrompt: 'You are a Socratic Tutor. Guide the user to discover solutions independently by asking thought-provoking, incremental questions rather than giving immediate answers.'
  },
  {
    id: 'designer',
    name: 'UI/UX Architect',
    iconKey: 'palette',
    description: 'Modern component & design systems',
    systemPrompt: 'You are a Principal UI/UX Architect. Focus on modern glassmorphism design systems, micro-interactions, responsive accessibility, and clean visual hierarchy.'
  }
];

function getCustomGems() {
  const gems = readStorage('berto-custom-gems', null);
  if (gems) return gems;

  dbStorage.get('settings', 'berto-custom-gems')
    .then(asyncGems => {
      if (asyncGems && Array.isArray(asyncGems)) {
        writeStorage('berto-custom-gems', JSON.stringify(asyncGems));
        renderGemSelector();
      }
    }).catch(() => {});

  return [];
}

function saveCustomGems(gems) {
  const json = JSON.stringify(gems);
  
  const savedLocally = writeStorage('berto-custom-gems', json);

  dbStorage.set('settings', 'berto-custom-gems', gems)
    .catch(err => console.warn('[Berto] IndexedDB Gems backup failed:', err));

  if (!savedLocally) {
    toast('Local quota full. Gem saved safely to IndexedDB storage!', 'info');
  }

  renderGemSelector();
}

function getAllGems() {
  return [...BUILTIN_GEMS, ...getCustomGems()];
}

function getGemIconSvg(iconKey) {
  return GEM_SVG_ICONS[iconKey] || GEM_SVG_ICONS.sparkles;
}

function renderGemSelector() {
  const select = document.getElementById('persona-select');
  const iconContainer = document.querySelector('.persona-icon');
  if (!select) return;

  const currentVal = select.value || 'default';
  const allGems = getAllGems();

  select.innerHTML = allGems.map(gem => `
    <option value="${gem.id}" ${gem.id === currentVal ? 'selected' : ''}>
      ${escapeHtml(gem.name)}
    </option>
  `).join('');

  const activeGem = allGems.find(g => g.id === currentVal) || BUILTIN_GEMS[0];
  if (iconContainer) {
    iconContainer.innerHTML = getGemIconSvg(activeGem.iconKey);
  }
}

function openGemsManagerModal() {
  const customGems = getCustomGems();
  let selectedIconKey = 'bot';

  const gemsListHtml = customGems.length ? customGems.map(gem => `
    <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:var(--surface-3); border:1px solid var(--border); border-radius:10px; margin-bottom:8px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="color:var(--accent); display:flex; align-items:center;">${getGemIconSvg(gem.iconKey)}</span>
        <div>
          <strong style="color:var(--text); font-size:13px;">${escapeHtml(gem.name)}</strong>
          <p style="margin:2px 0 0; color:var(--muted); font-size:11px;">${escapeHtml(gem.description || 'Custom Gem')}</p>
        </div>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="button ghost" data-action="edit-gem" data-gem-id="${gem.id}" style="padding:4px 8px; font-size:11px;">Edit</button>
        <button class="button danger" data-action="delete-gem" data-gem-id="${gem.id}" style="padding:4px 8px; font-size:11px;">Delete</button>
      </div>
    </div>
  `).join('') : '<p style="color:var(--faint); font-size:12px; margin-bottom:14px;">No custom Gems created yet.</p>';

  const svgPickerHtml = Object.keys(GEM_SVG_ICONS).map(key => `
    <button type="button" class="gem-svg-option ${key === selectedIconKey ? 'active' : ''}" data-icon-key="${key}" title="${key}">
      ${GEM_SVG_ICONS[key]}
    </button>
  `).join('');

  const modalBody = `
    <div style="margin-bottom:20px;">
      <h4 style="margin:0 0 8px; font-size:14px; color:var(--text);">Your Custom Gems</h4>
      ${gemsListHtml}
    </div>

    <div style="border-top:1px solid var(--border); padding-top:16px;">
      <h4 id="gem-form-title" style="margin:0 0 12px; font-size:14px; color:var(--accent);">+ Create New Gem</h4>
      
      <input type="hidden" id="gem-form-id" value="">
      
      <label class="modal-label">Gem Icon
        <div class="gem-svg-picker-grid" id="gem-svg-picker">
          ${svgPickerHtml}
        </div>
      </label>

      <label class="modal-label">Gem Name
        <input type="text" id="gem-form-name" placeholder="e.g. Spanish Tutor">
      </label>

      <label class="modal-label">Short Description
        <input type="text" id="gem-form-desc" placeholder="Brief summary of what this Gem does">
      </label>

      <label class="modal-label">System Prompt / Instructions
        <textarea id="gem-form-prompt" placeholder="Write detailed instructions for how Gemini should behave..." style="min-height:110px;"></textarea>
      </label>

      <div class="modal-actions" style="margin-top:12px;">
        <button class="button ghost" data-action="close-modal">Cancel</button>
        <button class="button primary" data-action="save-gem">Save Gem</button>
      </div>
    </div>
  `;

  openModal('Berto Gems Manager', modalBody);

  const pickerGrid = document.getElementById('gem-svg-picker');
  pickerGrid?.querySelectorAll('.gem-svg-option').forEach(btn => {
    btn.onclick = () => {
      pickerGrid.querySelectorAll('.gem-svg-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });
}

document.getElementById('persona-select')?.addEventListener('change', () => {
  renderGemSelector();
});

// Run selector initialization on load
renderGemSelector();