// Berto Settings UI & First-Time Setup Overlay

window.setVoiceFeaturesDisabled = function(disabled = true) {
  store.update({ voiceFeaturesDisabled: disabled });
  if (disabled) {
    document.documentElement.setAttribute('data-voice-disabled', 'true');
    if (store.state.route === 'voice') {
      route('chat');
      toast('Voice features are disabled on this account/network.', 'info');
    }
  } else {
    document.documentElement.removeAttribute('data-voice-disabled');
  }
};

window.detectManagedAccountRestrictions = async function() {
  const key = localStorage.getItem(CONFIG.storage.apiKey)?.trim();
  if (!key) return;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
    if (!response.ok && (response.status === 403 || response.status === 400)) {
      console.warn('[Berto] School/Workspace account restriction detected.');
      window.setVoiceFeaturesDisabled(true);
      return;
    }

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(key)}`;
    const testWs = new WebSocket(wsUrl);
    const wsTimer = setTimeout(() => { try { testWs.close(); } catch(e) {} }, 2000);

    testWs.onerror = () => {
      clearTimeout(wsTimer);
      window.setVoiceFeaturesDisabled(true);
    };

    testWs.onopen = () => {
      clearTimeout(wsTimer);
      window.setVoiceFeaturesDisabled(false);
      try { testWs.close(); } catch(e) {}
    };
  } catch (err) {
    console.warn('[Berto] Error checking account restrictions:', err);
  }
};

function renderSettings() {
  const key = $('#api-key-setting');
  if (key && document.activeElement !== key) key.value = localStorage.getItem(CONFIG.storage.apiKey) || '';

  const content = $('.settings-content');
  const aiSection = $$('.settings-section')[1];
  if (aiSection && !$('#voice-restriction-setting-row')) {
    const voiceRow = document.createElement('div');
    voiceRow.className = 'setting-row';
    voiceRow.id = 'voice-restriction-setting-row';
    voiceRow.innerHTML = `
      <div>
        <strong>Disable Voice Features</strong>
        <span>Hide Live Voice, Read Aloud, and dictation for school/restricted accounts.</span>
      </div>
      <label class="switch">
        <input id="disable-voice-toggle" type="checkbox" ${store.state.voiceFeaturesDisabled ? 'checked' : ''}>
        <span></span>
      </label>
    `;
    aiSection.appendChild(voiceRow);

    $('#disable-voice-toggle')?.addEventListener('change', event => {
      setVoiceFeaturesDisabled(event.target.checked);
      toast(event.target.checked ? 'Voice features hidden' : 'Voice features enabled');
    });
  }

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
      if ($('#temperature-value')) $('#temperature-value').textContent = Number(event.target.value).toFixed(2);
    });
    $('#top-p-setting')?.addEventListener('input', event => {
      store.update({ topP: Number(event.target.value) });
      if ($('#top-p-value')) $('#top-p-value').textContent = Number(event.target.value).toFixed(2);
    });
    $('#auto-scroll-setting')?.addEventListener('change', event => store.update({ autoScroll: event.target.checked }));
    
    const nameInput = $('#name-setting');
    if (nameInput) {
      nameInput.value = readStorage(CONFIG.storage.preferences, {}).userName || 'User';
      nameInput.addEventListener('change', event => {
        savePreferences({ userName: event.target.value.trim() || 'User' });
        toast('Workspace name updated');
      });
    }
  }
}

// =========================================================
// FIRST-TIME SETUP OVERLAY (FIXED & SAFE)
// =========================================================
function initSetup() {
  const runSetup = () => {
    let overlay = $('#setup-overlay');

    const isComplete = readStorage(`${INSTANCE_PREFIX}-setup-complete`, false);
    if (isComplete) {
      if (overlay) overlay.hidden = true;
      return;
    }

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'setup-overlay';
      overlay.className = 'modal-backdrop';
      overlay.innerHTML = `
        <div class="modal-card setup-card" style="max-width: 440px; padding: 28px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 12px;">👋</div>
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 6px;">Welcome to Berto AI</h2>
          <p style="color: var(--muted, #94a3b8); font-size: 13px; margin-bottom: 20px;">
            Set up your name and Gemini API key to start using your workspace.
          </p>
          <div style="text-align: left; display: flex; flex-direction: column; gap: 14px;">
            <label class="modal-label">Your Name
              <input type="text" id="setup-name" class="search-input" placeholder="e.g. Alex" autofocus>
            </label>
            <label class="modal-label">Gemini API Key
              <input type="password" id="setup-api-key" class="search-input" placeholder="AIzaSy...">
            </label>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 24px;">
            <button id="setup-skip" class="button ghost" style="flex: 1;">Skip for now</button>
            <button id="setup-submit" class="button primary" style="flex: 2;" disabled>Get Started</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    overlay.hidden = false;

    const nameInput = $('#setup-name');
    const apiKeyInput = $('#setup-api-key');
    const submitBtn = $('#setup-submit');

    if (nameInput) nameInput.value = readStorage(CONFIG.storage.preferences, {}).userName || '';
    if (apiKeyInput) apiKeyInput.value = readStorage(CONFIG.storage.apiKey, '') || '';

    function updateSubmitState() {
      const hasName = (nameInput?.value || '').trim().length > 0;
      const hasKey = (apiKeyInput?.value || '').trim().length > 0;
      if (submitBtn) submitBtn.disabled = !(hasName && hasKey);
    }

    updateSubmitState();

    nameInput?.addEventListener('input', updateSubmitState);
    apiKeyInput?.addEventListener('input', updateSubmitState);

    if (submitBtn) {
      submitBtn.onclick = () => {
        const name = (nameInput?.value || '').trim();
        const key = (apiKeyInput?.value || '').trim();

        if (name) savePreferences({ userName: name });
        if (key) {
          writeStorage(CONFIG.storage.apiKey, key);
          toast('API key saved locally');
        }

        writeStorage(`${INSTANCE_PREFIX}-setup-complete`, 'true');
        overlay.hidden = true;
        toast(`Welcome, ${name || 'friend'}!`);
        
        if (typeof detectManagedAccountRestrictions === 'function') {
          detectManagedAccountRestrictions();
        }
      };
    }

    const skipBtn = $('#setup-skip');
    if (skipBtn) {
      skipBtn.onclick = () => {
        writeStorage(`${INSTANCE_PREFIX}-setup-complete`, 'true');
        overlay.hidden = true;
      };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSetup);
  } else {
    runSetup();
  }
}