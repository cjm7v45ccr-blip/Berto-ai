// Berto UI Automation Agent & Approval Workflows

let activeRequest = null;
let draftTimer = null;
let currentAttachments = [];

function isApiKeyProtected(target) {
  const t = String(target || '').toLowerCase();
  return t.includes('api-key') || t.includes('apikey') || t.includes('key-setting');
}

async function waitForElement(selector, timeoutMs = 3000) {
  const start = Date.now();

  if (!selector) return null;
  let cleanSelector = typeof selector === 'string' ? selector.trim().replace(/^#+/, '#') : '';

  // Comprehensive mapping of AI selector variations to actual DOM elements
  const selectorAliases = {
    '#writing-editor': '#writing-input',
    'writing-editor': '#writing-input',
    '#editor': '#writing-input',
    'editor': '#writing-input',
    'composer': '#prompt',
    'prompt': '#prompt',
    '.attach-file-button': '[data-action="attach"]',
    'attach-file-button': '[data-action="attach"]',
    '#attach-file-button': '[data-action="attach"]',
    'attach-button': '[data-action="attach"]',
    'attach': '[data-action="attach"]',
    '.camera-button': '[data-action="camera"]',
    'camera-button': '[data-action="camera"]',
    '#camera-button': '[data-action="camera"]',
    '#snap-photo-button': '#capture-btn',
    'snap-photo-button': '#capture-btn',
    '#snap-photo': '#capture-btn',
    'snap-photo': '#capture-btn',
    '#take-photo': '#capture-btn',
    'take-photo': '#capture-btn',
    '#capture-photo-button': '#capture-btn',
    'capture-photo-button': '#capture-btn',
    '#capture-btn': '#capture-btn',
    'capture-btn': '#capture-btn',
    '#send-camera-btn': '#send-camera-btn',
    'send-camera-btn': '#send-camera-btn',
    '#retake-btn': '#retake-btn',
    'retake-btn': '#retake-btn',
    'camera': '[data-action="camera"]',
    'send': '#send-button',
    'send-button': '#send-button',
    '#send': '#send-button',
    'chat': '[data-route="chat"]',
    'writing': '[data-route="writing"]',
    'files': '[data-route="files"]',
    'voice': '[data-route="voice"]',
    'settings': '[data-route="settings"]'
  };
  cleanSelector = selectorAliases[cleanSelector] || cleanSelector;

  while (Date.now() - start < timeoutMs) {
    let el = null;

    if (cleanSelector) {
      try {
        el = document.querySelector(cleanSelector);
      } catch (e) {}
    }

    if (!el && cleanSelector) {
      const targetAttr = cleanSelector.replace(/^[#\.]/, '');
      el = document.querySelector(`[data-action="${targetAttr}"]`) ||
           document.querySelector(`[data-route="${targetAttr}"]`) ||
           document.getElementById(targetAttr) ||
           document.querySelector(`.${targetAttr}`);
    }

    if (!el && cleanSelector) {
      const targetText = cleanSelector.replace(/^#/, '').toLowerCase();
      const candidates = [...document.querySelectorAll('button, a, input, select, textarea, [role="button"], .chat-item')];

      el = candidates.find(candidate => {
        const text = (candidate.textContent || candidate.value || '').trim().toLowerCase();
        const aria = (candidate.getAttribute('aria-label') || '').toLowerCase();
        const placeholder = (candidate.getAttribute('placeholder') || '').toLowerCase();
        return text.includes(targetText) || aria.includes(targetText) || placeholder.includes(targetText);
      });
    }

    if (el) {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
      if (isVisible) return el;
    }

    await new Promise(r => requestAnimationFrame(r));
  }

  return null;
}

// Universal UI Agent Engine
async function executeUiSequence(actions) {
  if (!Array.isArray(actions)) return;

  for (const step of actions) {
    try {
      const type = (step.action || '').toLowerCase();
      const targetStr = step.selector || step.target || step.view || '';

      if (isApiKeyProtected(targetStr)) {
        toast(`${LOGO_HTML} API Key modification is restricted for security.`, 'error');
        continue;
      }

      if (type === 'navigate' || type === 'route') {
        const view = step.view || step.target;
        route(view);
        toast(`${LOGO_HTML} Navigated to ${view}`);
        await sleep(400);
      }
      else if (type === 'set_name' || (type === 'type' && (targetStr === '#name-setting' || targetStr === 'name'))) {
        const newName = step.value || step.text || '';
        if (newName) {
          savePreferences({ userName: newName });
          const nameInput = $('#name-setting');
          if (nameInput) nameInput.value = newName;
          toast(`${LOGO_HTML} Workspace name updated to "${newName}"`);
        }
        await sleep(300);
      }
      else if (type === 'set_theme') {
        const themeVal = (step.value || 'dark').toLowerCase();
        
        // Trigger the new global function to change the UI visually and save it
        if (typeof savePreferences === 'function') {
          savePreferences({ theme: themeVal });
        }
        
        toast(`${LOGO_HTML} Theme updated to ${themeVal.charAt(0).toUpperCase() + themeVal.slice(1)}`);
        await sleep(300);
      }
      else if (type === 'click') {
        let el = await waitForElement(step.selector || step.target || step.text);

        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          el.focus?.();
          el.click();
          toast(`${LOGO_HTML} Clicked ${step.text ? `"${step.text}"` : (step.selector || step.target)}`);
        } else if (step.target || step.selector) {
          const actionKey = (step.target || step.selector || '').toLowerCase().replace(/^[#\.]/, '');
          if (actionKey.includes('snap') || actionKey.includes('capture') || actionKey.includes('photo')) {
            await executeUiSequence([{ action: 'snap_photo', countdown: 2 }]);
          } else if (actionKey.includes('camera')) {
            await openCamera();
          } else if (actionKey.includes('attach')) {
            $('#file-input')?.click();
          } else {
            console.warn(`[UI Agent] Selector not found: ${step.selector || step.target}`);
          }
        }
        await sleep(350);
      }
      else if (type === 'type' || type === 'type_text' || type === 'fill') {
        let selector = step.selector || step.target || '#prompt';
        if (selector === 'chat' || selector === 'prompt' || selector === 'chat-bar') {
          selector = '#prompt';
        }
        
        if (selector === '#prompt' && store.state.route !== 'chat') {
          route('chat');
          await sleep(300);
        }

        const el = await waitForElement(selector);

        if (el) {
          el.focus();
          if (step.clear !== false) el.value = '';

          const text = step.value || step.text || '';
          const batchSize = step.speed ? 1 : 4;

          for (let i = 0; i < text.length; i += batchSize) {
            el.value += text.slice(i, i + batchSize);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            if (selector === '#writing-input' && typeof writingMetrics === 'function') writingMetrics();
            if (selector === '#prompt') {
              updateCount();
              resizePrompt();
            }
            await sleep(step.speed || 15);
          }
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          toast(`Input field not found: ${selector}`, 'error');
        }
        await sleep(250);
      }
      else if (type === 'select' || type === 'set_mode') {
        const el = await waitForElement(step.selector || '#writing-mode');
        if (el) {
          el.value = step.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          toast(`${LOGO_HTML} Selected ${step.value}`);
        }
        await sleep(200);
      }
      else if (type === 'key' || type === 'press_key') {
        const el = (await waitForElement(step.selector)) || document.activeElement || document.body;
        const eventInit = { key: step.key, code: step.key, bubbles: true, cancelable: true };
        el.dispatchEvent(new KeyboardEvent('keydown', eventInit));
        el.dispatchEvent(new KeyboardEvent('keypress', eventInit));
        el.dispatchEvent(new KeyboardEvent('keyup', eventInit));
        toast(`${LOGO_HTML} Pressed [${step.key}]`);
        await sleep(200);
      }
      else if (type === 'call' || type === 'exec') {
        if (step.fn && typeof window[step.fn] === 'function') {
          window[step.fn](...(step.args || []));
        } else if (step.name) {
          handleAction(step.name);
        }
        await sleep(300);
      }
      else if (type === 'wait' || type === 'sleep') {
        await sleep(step.ms || 500);
      }
      else if (type === 'send_chat') {
        const messageText = step.value || step.text || $('#prompt')?.value.trim() || '';
        route('chat');
        await sleep(300);

        if (messageText) {
          const promptEl = $('#prompt');
          if (promptEl) {
            promptEl.value = messageText;
            updateCount();
            resizePrompt();
          }
          toast(`${LOGO_HTML} Sending query to chat...`);
          await sleep(200);
          send(messageText);
        }
        await sleep(500);
      }
      else if (type === 'click_text' || type === 'click_by_text') {
        const searchText = (step.text || step.value || '').toLowerCase().trim();
        if (searchText) {
          const candidates = [...document.querySelectorAll('button, a, select, [role="button"], .chat-item, .nav-item')];
          const match = candidates.find(el => (el.textContent || '').toLowerCase().includes(searchText));

          if (match) {
            match.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await sleep(200);
            match.focus?.();
            match.click();
            toast(`${LOGO_HTML} Clicked element containing "${searchText}"`);
          } else {
            toast(`Could not find element with text: "${searchText}"`, 'warn');
          }
        }
        await sleep(300);
      }
      else if (type === 'scroll' || type === 'scroll_view') {
        const direction = step.direction || 'down';
        const targetEl = step.selector ? $(step.selector) : ($('.chat-scroll') || window);
        const amount = step.amount || 400;

        if (targetEl) {
          if (targetEl.scrollBy) {
            targetEl.scrollBy({ top: direction === 'down' ? amount : -amount, behavior: 'smooth' });
          } else {
            window.scrollBy({ top: direction === 'down' ? amount : -amount, behavior: 'smooth' });
          }
          toast(`${LOGO_HTML} Scrolled ${direction}`);
        }
        await sleep(300);
      }
      else if (type === 'create_artifact' || type === 'open_artifact') {
        const title = step.title || 'Interactive Application';
        const htmlContent = step.html || step.code || step.value || '';

        if (htmlContent) {
          openArtifact(htmlContent, title);
          toast(`${LOGO_HTML} Launched Artifact: "${title}"`, 'success');
        } else {
          toast(`No HTML content provided for artifact`, 'error');
        }
        await sleep(400);
      }
      else if (type === 'show_live_popup' || type === 'show_summary_popup') {
        const title = step.title || 'Live Summary';
        const content = step.value || step.text || step.content || 'No summary text generated.';
        
        showLiveSummaryPopup(title, content);
        await sleep(300);
      }
      else if (type === 'new_chat') {
        store.addChat();
        renderChats();
        renderMessages();
        toast(`${LOGO_HTML} Started new conversation`);
        await sleep(300);
        
        if (step.value || step.text) {
          send(step.value || step.text);
        }
      }
      else if (type === 'summarize_to_live' || type === 'send_to_live') {
        toast(`${LOGO_HTML} Transferring chat context to Berto Live...`);
        await summarizeAndSendToLive();
        await sleep(500);
      }
      else if (type === 'showcase_features' || type === 'demo' || type === 'show_off') {
        await runFeatureShowcase();
      }
      else if (type === 'save_memory' || type === 'remember' || type === 'add_memory') {
        const memoryFact = step.value || step.text || step.fact || '';
        if (memoryFact && window.bertoMemory) {
          await window.bertoMemory.addMemory(memoryFact);
        } else if (!window.bertoMemory) {
          console.warn('[Berto] Memory engine unavailable');
        }
        await sleep(200);
      }
      else if (type === 'delete_memory' || type === 'forget' || type === 'remove_memory') {
        const targetText = step.value || step.text || step.fact || '';
        if (targetText && window.bertoMemory) {
          await window.bertoMemory.removeMemoryByText(targetText);
        }
        await sleep(200);
      }
      else if (type === 'rename_chat') {
        const targetId = step.id || store.state.activeChatId;
        const newTitle = step.title || step.value;
        if (newTitle) {
          store.renameChat(targetId, newTitle);
          renderChats();
          toast(`Renamed chat to "${newTitle}"`, 'success');
        }
      }
      else if (type === 'snap_photo' || type === 'take_photo' || type === 'capture_photo') {
        route('chat');
        await sleep(300);

        toast(`${LOGO_HTML} Opening camera...`, 'info');
        await openCamera();
        await sleep(300);

        const countdown = step.countdown || 2;
        toast(`${LOGO_HTML} Get ready! Snapping photo in ${countdown}s...`, 'info');
        await sleep(countdown * 1000);

        capturePhoto();
        await sleep(400);

        await sendCameraPhoto();
        await sleep(300);

        const promptInput = $('#prompt');
        const photoPrompt = step.prompt || step.value || step.text || '';
        
        if (promptInput) {
          if (photoPrompt) {
            promptInput.value = photoPrompt;
          }
          updateCount();
          resizePrompt();
          promptInput.focus();
          pulseHighlight('#composer', 1500);
        }

        toast(`${LOGO_HTML} Photo attached to prompt! Ready to send.`, 'success');
      }
      else if (type === 'open_camera') {
        route('chat');
        await sleep(300);
        toast(`${LOGO_HTML} Opening camera...`, 'info');
        await openCamera();
        toast(`${LOGO_HTML} Camera open. Tap Capture when ready.`, 'info');
      }
      else if (type === 'patch_artifact' || type === 'patch_artifact_element') {
        const frame = $('#artifact-frame');
        if (frame && frame.contentDocument) {
          const doc = frame.contentDocument;
          const targetEl = step.selector ? doc.querySelector(step.selector) : null;
          
          if (targetEl && step.html !== undefined) {
            targetEl.innerHTML = step.html;
            toast(`${LOGO_HTML} Updated artifact element (${step.selector})`);
          } else if (step.appendHtml) {
            doc.body.insertAdjacentHTML('beforeend', step.appendHtml);
            toast(`${LOGO_HTML} Appended content to artifact`);
          } else if (step.text !== undefined && targetEl) {
            targetEl.textContent = step.text;
            toast(`${LOGO_HTML} Updated artifact text (${step.selector})`);
          } else {
            toast(`Artifact frame not available for patching`, 'warn');
          }
        } else {
          toast(`Artifact frame not available for patching`, 'warn');
        }
        await sleep(300);
      }
      else if (type === 'clear_all_chats' || type === 'delete_chat' || type === 'delete_current_chat' || type === 'clear_data') {
        const approved = await requestApproval({
          title: type === 'clear_all_chats' ? 'Clear All Chats' : type === 'clear_data' ? 'Clear All Workspace Data' : 'Delete Chat',
          description: type === 'clear_all_chats' 
            ? 'This will permanently delete ALL chat history. This action cannot be undone.'
            : type === 'clear_data'
              ? 'This will permanently delete ALL local workspace data including chats, files, and settings.'
              : `This will permanently delete the chat "${store.state.chats.find(c => c.id === (step.id || step.chatId || store.state.activeChatId))?.title || 'current chat'}".`,
          actionType: type
        });

        if (approved) {
          if (type === 'clear_all_chats') {
            store.update({ chats: [store.newChatRecord('Untitled conversation')] });
            store.selectChat(store.state.chats[0].id);
            renderChats();
            renderMessages();
            toast('All chat history cleared', 'warn');
          } else if (type === 'clear_data') {
            Object.values(CONFIG.storage).forEach(key => localStorage.removeItem(key));
            localStorage.removeItem(`${INSTANCE_PREFIX}-writing-draft`);
            localStorage.removeItem(`${INSTANCE_PREFIX}-model-usage`);
            localStorage.removeItem(`${INSTANCE_PREFIX}-setup-complete`);
            location.reload();
          } else {
            const targetId = step.id || step.chatId || store.state.activeChatId;
            const chatToDelete = store.state.chats.find(c => c.id === targetId);
            if (chatToDelete) {
              const title = chatToDelete.title;
              store.deleteChat(targetId);
              renderChats();
              renderMessages();
              toast(`Deleted chat: "${title}"`, 'info');
            }
          }
        } else {
          toast('Action cancelled by user', 'info');
        }
      }

    } catch (e) {
      console.error('[Berto UI Agent Error]', e, step);
      reportUiError(e, step);
    }
  }
}

// =========================================================
// HUMAN-IN-THE-LOOP SAFE APPROVAL CARDS
// =========================================================
function requestApproval({ title, description, actionType }) {
  return new Promise((resolve) => {
    const cardId = `approval_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const cardHtml = `
      <div class="approval-card pending" id="${cardId}">
        <div class="approval-card-header">
          <span class="approval-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 9v4"/><path d="M12 17h.01"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </span>
          <span class="approval-card-title">${escapeHtml(title)}</span>
        </div>
        <div class="approval-card-desc">${escapeHtml(description)}</div>
        <div class="approval-card-actions">
          <button class="approval-btn reject" data-approval-reject="${cardId}">Reject</button>
          <button class="approval-btn approve" data-approval-approve="${cardId}">Approve</button>
        </div>
      </div>
    `;

    const messagesBox = $('#messages');
    if (messagesBox) {
      messagesBox.insertAdjacentHTML('beforeend', cardHtml);
      if (store.state.autoScroll && $('.chat-scroll')) $('.chat-scroll').scrollTop = $('.chat-scroll').scrollHeight;
    }

    const approveBtn = document.querySelector(`[data-approval-approve="${cardId}"]`);
    const rejectBtn = document.querySelector(`[data-approval-reject="${cardId}"]`);
    const card = document.getElementById(cardId);

    const handleDecision = (approved) => {
      if (card) {
        card.classList.remove('pending');
        card.classList.add(approved ? 'approved' : 'rejected');
        card.querySelector('.approval-card-actions')?.remove();
        if (approved) {
          card.querySelector('.approval-card-desc')?.insertAdjacentHTML('afterend', `<div style="color:#82f3d0; font-size:11px; font-weight:600; margin-top:6px;">✓ Approved</div>`);
        } else {
          card.querySelector('.approval-card-desc')?.insertAdjacentHTML('afterend', `<div style="color:#ed9b9b; font-size:11px; font-weight:600; margin-top:6px;">✕ Rejected</div>`);
        }
      }
      resolve(approved);
    };

    approveBtn?.addEventListener('click', () => handleDecision(true));
    rejectBtn?.addEventListener('click', () => handleDecision(false));

    setTimeout(() => {
      if (card && card.classList.contains('pending')) {
        handleDecision(false);
      }
    }, 30000);
  });
}

// =========================================================
// SELF-CORRECTION FEEDBACK LOOP
// =========================================================
function reportUiError(error, step) {
  const errorMsg = error?.message || 'Unknown UI action error';
  const selector = step?.selector || step?.target || step?.view || 'unknown';
  const actionType = step?.action || 'unknown';

  let suggestedFix = '';
  if (errorMsg.includes('not found') || errorMsg.includes('null') || errorMsg.includes('undefined')) {
    suggestedFix = `Navigate to the correct view first, then retry the "${actionType}" action on "${selector}".`;
  } else if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
    suggestedFix = `Request user permission before attempting "${actionType}".`;
  } else {
    suggestedFix = `Review the "${actionType}" action parameters and retry.`;
  }

  const messagesBox = $('#messages');
  if (messagesBox) {
    const reportHtml = `
      <div class="error-report-card">
        <div class="error-report-card-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          UI Action Failed — Auto-correction suggested
        </div>
        <div class="error-report-card-body">
          <strong>Error:</strong> ${escapeHtml(errorMsg)}<br>
          <strong>Action:</strong> ${escapeHtml(actionType)} on "${escapeHtml(selector)}"
        </div>
        <div class="error-report-card-fix">
          <strong>Suggested Fix:</strong> ${escapeHtml(suggestedFix)}
        </div>
      </div>
    `;
    messagesBox.insertAdjacentHTML('beforeend', reportHtml);
    if (store.state.autoScroll && $('.chat-scroll')) $('.chat-scroll').scrollTop = $('.chat-scroll').scrollHeight;
  }

  console.warn('[Berto UI Agent] Self-correction report:', { error: errorMsg, suggestedFix, step });
}