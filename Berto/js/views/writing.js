// Berto Writing Studio, Dictation & Style Cloning

let recognitionInstance = null;

function openWritingProfile() {
  const profile = store.profile;
  openModal('Writing Profile & Style Cloning', `
    <p class="modal-copy">Paste real sample writing here (texts, emails, notes). Berto will strictly clone your sentence structure, rhythm, and word choices without inventing fake plans or details.</p>
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
          <option ${profile.vocabulary === 'Technical & academic' ? 'selected' : ''}>Technical & academic</option>
          <option ${profile.vocabulary === 'Rich & expressive' ? 'selected' : ''}>Rich & expressive</option>
        </select>
      </label>
      <label class="modal-label">Style
        <select id="profile-style">
          <option ${profile.style === 'Conversational' ? 'selected' : ''}>Conversational</option>
          <option ${profile.style === 'Direct' ? 'selected' : ''}>Direct</option>
          <option ${profile.style === 'Storytelling' ? 'selected' : ''}>Storytelling</option>
        </select>
      </label>
    </div>
    <label class="modal-label">Writing samples
      <textarea class="profile-samples" id="profile-samples" placeholder="Paste real sample texts or messages here...">${escapeHtml(profile.samples.join('\n\n'))}</textarea>
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
  if ($('#profile-card-summary')) $('#profile-card-summary').textContent = `${profile.tone}, ${profile.formality.toLowerCase()}.`;
  
  if ($('#profile-tags')) {
    const tags = [profile.formality, profile.style, profile.vocabulary].filter(Boolean);
    $('#profile-tags').innerHTML = tags.map(tag => `<span class="profile-tag-badge">${escapeHtml(tag)}</span>`).join(' ');
  }
}

function toggleWritingDictation() {
  const btn = $('#dictate-btn');
  const input = $('#writing-input');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return toast('Speech recognition is not supported in this browser.', 'error');
  }

  if (recognitionInstance) {
    recognitionInstance.stop();
    recognitionInstance = null;
    if (btn) btn.innerHTML = '<span><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M395-435q-35-35-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35q-50 0-85-35Zm85-205Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm68.5-371.5Q520-503 520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480q17 0 28.5-11.5Z"/></svg> Dictate</span>';
    toast('Dictation stopped');
    return;
  }

  recognitionInstance = new SpeechRecognition();
  recognitionInstance.continuous = true;
  recognitionInstance.interimResults = true;

  recognitionInstance.onend = () => {
    recognitionInstance = null;
    if (btn) btn.innerHTML = '<span><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M395-435q-35-35-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35q-50 0-85-35Zm85-205Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm68.5-371.5Q520-503 520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480q17 0 28.5-11.5Z"/></svg> Dictate</span>';
  };

  recognitionInstance.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript && input) {
      input.value += (input.value ? ' ' : '') + finalTranscript;
      writingMetrics();
    }
  };

  recognitionInstance.start();
  if (btn) btn.innerHTML = `<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> Dictate</span>`;
  toast('Listening... Speak your notes out loud.');
}

function profilePrompt() {
  const p = store.profile;
  if (!p.samples || !p.samples.length) return '';

  return `
USER WRITING SAMPLES (Analyze capitalization, sentence brevity, slang, and vocabulary below):
${p.samples.map((s, i) => `--- SAMPLE ${i + 1} ---\n${s}`).join('\n\n')}
`;
}

async function generateWriting() {
  const inputEl = $('#writing-input');
  const draft = inputEl ? inputEl.value.trim() : '';
  if (!draft) return toast('Add an idea or draft first', 'error');
  const key = api.key();
  if (!key) return toast('Add your Gemini API key in Settings first', 'error');

  const output = $('#writing-output');
  if (!output) return;
  output.hidden = false;
  output.innerHTML = '<div class="typing"><i></i><i></i><i></i></div>';

  try {
    const profile = store.profile;
    const modeEl = $('#writing-mode');
    const mode = modeEl ? modeEl.value : 'Document';

    const formatInstructions = {
      'Essay': `Structure as a well-formed, multi-paragraph essay with a clear thesis, body arguments, and conclusion. Do not use conversational greetings (e.g. "Hi my name is..."). Focus objectively on the topic.`,
      'Professional Email': `Structure as a crisp email with a Subject Line, professional greeting, concise body paragraphs, and a sign-off.`,
      'Executive Summary': `Use bold headers, bullet points, and key takeaway metrics. Keep it high-level and structured.`,
      'Blog': `Use an engaging headline, catchy introduction, subheadings, and a conversational yet informative flow.`,
      'Cover Letter': `Structure as a formal job application letter with paragraph breaks highlighting relevant skills and enthusiasm.`
    };

    const selectedFormatRules = formatInstructions[mode] || `Draft a structured ${mode}.`;

    const systemPrompt = `You are an elite ghostwriter executing a draft in the format of a **${mode}**.

━━━━━━━━━━━━━━━━━━
FORMAT STRUCTURE INSTRUCTIONS (${mode.toUpperCase()})
━━━━━━━━━━━━━━━━━━
${selectedFormatRules}

━━━━━━━━━━━━━━━━━━
VOICE & STYLE MATCHING (CLONE THIS STYLE)
━━━━━━━━━━━━━━━━━━
- Tone: ${profile.tone || 'Balanced'}
- Formality Level: ${profile.formality || 'Balanced'}
- Adopt the user's vocabulary choices, sentence length rhythm, and tone from the samples below.
- CRITICAL: Adapt the voice to suit a ${mode}. Do NOT insert casual personal introductions or chat greetings unless the format explicitly calls for it.

USER WRITING SAMPLES FOR STYLE CLONING:
${(profile.samples || []).map((s, i) => `--- SAMPLE ${i + 1} ---\n${s}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━
1. Fulfill the user's prompt thoroughly using accurate facts and structured reasoning appropriate for a ${mode}.
2. Output ONLY the final written content. Do not include preamble, conversational fluff, or meta-commentary.`;

    const result = await api.request({
      prompt: draft,
      system: systemPrompt,
      preferred: store.state.model,
      temperature: 0.6,
      topP: store.state.topP
    });

    output.innerHTML = typeof renderMarkdownEnhanced === 'function' ? renderMarkdownEnhanced(result.text) : renderMarkdown(result.text);
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
  const inputEl = $('#writing-input');
  const text = inputEl ? inputEl.value : '';
  const words = wordCount(text);
  const score = readability(text);
  if ($('#writing-metrics')) $('#writing-metrics').textContent = `${formatCount(words)} words · readability ${score}`;
}

function saveDraft() {
  const inputEl = $('#writing-input');
  const value = inputEl ? inputEl.value : '';
  writeStorage(`${INSTANCE_PREFIX}-writing-draft`, JSON.stringify(value));
  if ($('#writing-save-status')) $('#writing-save-status').textContent = 'Saved just now';
}