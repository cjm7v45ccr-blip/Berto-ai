// Berto App Initialization, Event Delegation & Slash Commands

// =========================================================
// MODAL ACCESSIBILITY FOCUS TRAP
// =========================================================
function trapModalFocus(modalEl) {
  if (!modalEl) return;
  
  const focusables = modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  modalEl.onkeydown = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };
}

function openModal(title, bodyHtml) {
  const backdrop = $('#modal');
  const titleEl = $('#modal-title');
  const bodyEl = $('#modal-body');
  if (!backdrop || !titleEl || !bodyEl) return;
  
  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;
  backdrop.hidden = false;

  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  
  if (typeof trapModalFocus === 'function') {
    trapModalFocus(backdrop);
  }
  
  setTimeout(() => {
    const firstFocusable = backdrop.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();
  }, 100);
}

function closeModal() {
  const backdrop = $('#modal');
  if (backdrop) backdrop.hidden = true;
}

function openLightbox(src) {
  const lightbox = $('#image-lightbox');
  const img = $('#lightbox-image');
  if (lightbox && img) {
    img.src = src;
    lightbox.hidden = false;
  }
}

function closeLightbox() {
  const lightbox = $('#image-lightbox');
  const img = $('#lightbox-image');
  if (lightbox) lightbox.hidden = true;
  if (img) img.src = '';
}

// =========================================================
// Markdown Rendering (With Full Table Support & SVG/Graph Preservation)
// =========================================================
function renderMarkdown(input = '') {
  if (!input) return '';

  const svgBlocks = [];
  let html = input.replace(/<svg[\s\S]*?<\/svg>/gi, (match) => {
    const placeholder = `%%SVG_BLOCK_${svgBlocks.length}%%`;
    svgBlocks.push(match);
    return placeholder;
  });

  const lines = html.split('\n');
  let resultHtml = '';
  let inCode = false;
  let code = '';
  let language = '';
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inTable) { resultHtml += '</tbody></table></div>'; inTable = false; }
      if (inCode) {
        const safeCode = escapeHtml(code.trimEnd());
        const langLower = language.toLowerCase();

        if (langLower === 'chart' || langLower === 'mermaid') {
          resultHtml += `<pre class="code-block"><code class="language-${langLower}">${encodeURIComponent(code)}</code></pre>`;
        } else {
          const runBtn = langLower === 'html' ? `<button class="code-run" data-run-html="${encodeURIComponent(code)}">Run</button>` : '';
          resultHtml += `<pre class="code-block">${runBtn}<button class="code-copy" data-code-copy="${encodeURIComponent(code)}">Copy</button><code class="language-${language}">${safeCode}</code></pre>`;
        }
        code = '';
        inCode = false;
      } else {
        language = escapeHtml(line.slice(3).trim()) || 'text';
        inCode = true;
      }
      continue;
    }

    if (inCode) { code += `${line}\n`; continue; }

    const safeLine = escapeHtml(line.trim());

    if (safeLine.startsWith('|') && safeLine.endsWith('|')) {
      if (/^\|[\s-:]+(\|[\s-:]+)+\|$/.test(safeLine)) continue;
      const cells = safeLine.split('|').slice(1, -1).map(c => c.trim());

      if (!inTable) {
        inTable = true;
        resultHtml += `<div class="table-container my-3 overflow-x-auto rounded-xl border border-white/10 bg-white/5 shadow-lg"><table class="w-full text-left text-sm text-slate-200"><thead><tr class="border-b border-white/10 bg-white/5 font-semibold">`;
        cells.forEach(c => { resultHtml += `<th class="px-4 py-2.5">${inlineMarkdown(c)}</th>`; });
        resultHtml += `</tr></thead><tbody>`;
      } else {
        resultHtml += `<tr class="border-b border-white/5 hover:bg-white/5">`;
        cells.forEach(c => { resultHtml += `<td class="px-4 py-2.5">${inlineMarkdown(c)}</td>`; });
        resultHtml += `</tr>`;
      }
      continue;
    } else if (inTable) {
      resultHtml += `</tbody></table></div>`;
      inTable = false;
    }

    if (/^### /.test(safeLine)) resultHtml += `<h4>${safeLine.slice(4)}</h4>`;
    else if (/^## /.test(safeLine)) resultHtml += `<h3>${safeLine.slice(3)}</h3>`;
    else if (/^# /.test(safeLine)) resultHtml += `<h2>${safeLine.slice(2)}</h2>`;
    else if (/^[-*] \[\s?\] /.test(safeLine)) {
      resultHtml += `<li class="task-list-item"><input type="checkbox" class="chat-checkbox"> <span>${inlineMarkdown(safeLine.replace(/^[-*] \[\s?\] /, ''))}</span></li>`;
    }
    else if (/^[-*] \[x\] /i.test(safeLine)) {
      resultHtml += `<li class="task-list-item"><input type="checkbox" class="chat-checkbox" checked> <span class="completed-task">${inlineMarkdown(safeLine.replace(/^[-*] \[x\] /i, ''))}</span></li>`;
    }
    else if (/^[-*] /.test(safeLine)) resultHtml += `<li>${inlineMarkdown(safeLine.slice(2))}</li>`;
    else if (/^\d+\. /.test(safeLine)) resultHtml += `<li>${inlineMarkdown(safeLine.replace(/^\d+\. /, ''))}</li>`;
    else if (!safeLine) resultHtml += '<div class="md-break"></div>';
    else resultHtml += `<p>${inlineMarkdown(safeLine)}</p>`;
  }

  if (inTable) resultHtml += `</tbody></table></div>`;

  if (inCode) {
    const safeCode = escapeHtml(code.trimEnd());
    const langLower = language.toLowerCase();
    const runBtn = langLower === 'html' ? `<button class="code-run" data-run-html="${encodeURIComponent(code)}">Run</button>` : '';
    resultHtml += `<pre class="code-block streaming-active">${runBtn}<button class="code-copy" data-code-copy="${encodeURIComponent(code)}">Copy</button><code class="language-${language}">${safeCode}</code></pre>`;
  }

  resultHtml = resultHtml.replace(/%%SVG_BLOCK_(\d+)%%/g, (_, idx) => svgBlocks[parseInt(idx)]);

  return resultHtml.replace(/(<li>.*?<\/li>\s*)+/g, list => `<ul>${list}</ul>`);
}

function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

// =========================================================
// Chart JSON Sanitizer
// =========================================================
function sanitizeChartJson(raw = '') {
  return String(raw)
    .replace(/,\s*}/g, '}')
    .replace(/,\s*\]/g, ']')
    .trim();
}

// =========================================================
// UNIVERSAL MATH & MARKDOWN PARSER
// =========================================================
function renderMarkdownEnhanced(input = '') {
  if (!input) return '';

  let text = input;

  const codeBlocks = [];
  text = text.replace(/```[\s\S]*?```|`[^`]+`/g, (match) => {
    const placeholder = `%%CODEBLOCK_${codeBlocks.length}%%`;
    codeBlocks.push(match);
    return placeholder;
  });

  const mathBlocks = [];
  text = text.replace(/\$\$(.*?)\$\$/gs, (match, math) => {
    const placeholder = `%%MATHBLOCK_${mathBlocks.length}%%`;
    mathBlocks.push(math.trim());
    return placeholder;
  });

  const mathInlines = [];
  text = text.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, (match, math) => {
    const placeholder = `%%MATHINLINE_${mathInlines.length}%%`;
    mathInlines.push(math.trim());
    return placeholder;
  });

  text = text.replace(/%%CODEBLOCK_(\d+)%%/g, (_, idx) => codeBlocks[parseInt(idx)]);

  let html = renderMarkdown(text);

  if (window.katex) {
    html = html.replace(/%%MATHBLOCK_(\d+)%%/g, (_, idx) => {
      const rawMath = mathBlocks[parseInt(idx)];
      try {
        return `<div class="math-block">${window.katex.renderToString(rawMath, { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return `<div class="math-block-plain">${cleanLatexToPlain(rawMath)}</div>`;
      }
    });

    html = html.replace(/%%MATHINLINE_(\d+)%%/g, (_, idx) => {
      const rawMath = mathInlines[parseInt(idx)];
      try {
        return window.katex.renderToString(rawMath, { displayMode: false, throwOnError: false });
      } catch (e) {
        return cleanLatexToPlain(rawMath);
      }
    });
  } else {
    html = html.replace(/%%MATHBLOCK_(\d+)%%/g, (_, idx) => {
      return `<div class="math-block-plain"><strong>${cleanLatexToPlain(mathBlocks[parseInt(idx)])}</strong></div>`;
    });

    html = html.replace(/%%MATHINLINE_(\d+)%%/g, (_, idx) => {
      return cleanLatexToPlain(mathInlines[parseInt(idx)]);
    });
  }

  html = html.replace(/<pre class="code-block"><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi, (match, code) => {
    const rawMermaid = decodeURIComponent(code).replace(/</g, '<').replace(/>/g, '>').replace(/&/g, '&');
    const id = `mermaid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    
    setTimeout(() => {
      if (window.mermaid) {
        window.mermaid.initialize({ 
          startOnLoad: false, 
          theme: document.documentElement.dataset.theme === 'light' ? 'default' : 'dark',
          securityLevel: 'loose'
        });
        const el = document.getElementById(id);
        if (el) {
          window.mermaid.render(`${id}_svg`, rawMermaid).then(({ svg }) => {
            el.innerHTML = svg;
          }).catch(err => {
            el.innerHTML = `<pre class="mermaid-error">Diagram render error</pre>`;
          });
        }
      }
    }, 100);

    return `<div class="mermaid-container" id="${id}"><div class="typing">Rendering Diagram...</div></div>`;
  });

  html = html.replace(/<pre class="code-block"><code class="language-chart">([\s\S]*?)<\/code><\/pre>/gi, (match, code) => {
    const rawChart = decodeURIComponent(code).replace(/</g, '<').replace(/>/g, '>').replace(/&/g, '&');
    const id = `chart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    setTimeout(() => {
      const canvas = document.getElementById(id);
      if (!canvas) return;

      if (!window.Chart) {
        canvas.outerHTML = `<pre class="chart-error">⚠️ Chart.js library failed to load. Check your internet connection or reload the page.</pre>`;
        return;
      }

      try {
        const config = JSON.parse(sanitizeChartJson(rawChart));
        if (Chart.getChart(canvas)) return;

        const isDark = document.documentElement.dataset.theme !== 'light';
        const textColor = isDark ? '#cbd5e1' : '#334155';
        const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
        const palette = ['#82f3d0', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#f87171', '#22d3ee'];

        const datasets = (config.datasets || []).map((ds, i) => ({
          label: ds.label || `Dataset ${i + 1}`,
          data: ds.data || [],
          borderColor: ds.color || palette[i % palette.length],
          backgroundColor: ds.backgroundColor || (ds.color || palette[i % palette.length]) + '33',
          fill: ds.fill !== undefined ? ds.fill : (config.type === 'line'),
          tension: config.type === 'line' ? 0.3 : undefined,
          borderWidth: 2,
          pointRadius: config.type === 'line' ? 3 : undefined
        }));

        const chartConfig = {
          type: config.type || 'bar',
          data: {
            labels: config.labels || [],
            datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: !!config.title,
                text: config.title || '',
                color: textColor,
                font: { size: 15, weight: '600' }
              },
              legend: {
                labels: { color: textColor }
              }
            },
            scales: (config.type === 'pie' || config.type === 'doughnut') ? {} : {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor }, grid: { color: gridColor } }
            }
          }
        };

        new Chart(canvas, chartConfig);
      } catch (err) {
        const currentCanvas = document.getElementById(id);
        if (currentCanvas) {
          currentCanvas.outerHTML = `<pre class="chart-error">⚠️ Chart render error: ${escapeHtml(err.message)}</pre>`;
        }
      }
    }, 50);

    return `<div class="chart-container"><canvas id="${id}"></canvas></div>`;
  });

  return html;
}

// Plain Text Sanitizer Helper
function cleanLatexToPlain(raw = '') {
  return raw
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1 / $2')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^{}]+)\}/g, '**$1**')
    .replace(/\\approx/g, '≈')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\/g, '');
}

// =========================================================
// INSTANT TOKEN STREAMER — Smooth Cinematic Line-by-Line Typing
// =========================================================
class SmoothStreamer {
  constructor(node) {
    this.node = node;
    this.targetText = '';
    this.renderedText = '';
    this.isStreaming = false;
    this.isFinished = false;
    this.finishResolver = null;
  }

  updateTarget(text) {
    this.targetText = text;
    if (!this.isStreaming) this.process();
  }

  finish() {
    this.isFinished = true;
    if (!this.isStreaming) this.process();
    return new Promise(resolve => {
      this.finishResolver = resolve;
    });
  }

  async process() {
    this.isStreaming = true;
    while (this.renderedText.length < this.targetText.length || !this.isFinished) {
      if (this.renderedText.length >= this.targetText.length) {
        if (this.isFinished) break;
        await sleep(10);
        continue;
      }

      const inCodeBlock = (this.renderedText.match(/```/g) || []).length % 2 !== 0;
      const remaining = this.targetText.substring(this.renderedText.length);

      let chunkSize = 1;
      let delay = 5;

      if (remaining.length > 150) {
        chunkSize = Math.floor(remaining.length / 4);
        delay = 5;
      } else if (inCodeBlock) {
        const nextNewline = remaining.indexOf('\n');
        if (nextNewline !== -1 && nextNewline < 150) {
          chunkSize = nextNewline + 1;
          delay = 12;
        } else {
          chunkSize = Math.min(15, remaining.length);
          delay = 5;
        }
      } else {
        chunkSize = Math.min(25, remaining.length);
        delay = 5;
      }

      this.renderedText += remaining.substring(0, chunkSize);
      
      const streamText = stripJsonActions(this.renderedText);
      let htmlToRender;
      if ((/```chart[\s\S]*?```/i.test(streamText) || /```mermaid[\s\S]*?```/i.test(streamText)) && typeof renderMarkdownEnhanced === 'function') {
        htmlToRender = renderMarkdownEnhanced(streamText);
      } else {
        htmlToRender = renderMarkdown(streamText);
      }
      if (!inCodeBlock && !this.isFinished) {
         htmlToRender += '<span class="stream-cursor"></span>';
      }
      
      this.node.innerHTML = htmlToRender;

      if (store.state.autoScroll && $('.chat-scroll')) {
        $('.chat-scroll').scrollTop = $('.chat-scroll').scrollHeight;
      }

      await sleep(delay);
    }
    
    this.isStreaming = false;
    
    if (this.node) {
      this.node.innerHTML = typeof renderMarkdownEnhanced === 'function' ? renderMarkdownEnhanced(this.renderedText) : renderMarkdown(this.renderedText);
      if (window.hljs) {
        this.node.querySelectorAll('pre code').forEach((block) => {
          window.hljs.highlightElement(block);
        });
      }
    }
    if (this.finishResolver) this.finishResolver();
  }
}

// =========================================================
// PERCEPTION LAYER: Live UI State Context Injection
// =========================================================
function getUiStateContext() {
  const artifactFrame = $('#artifact-frame');
  const artifactOpen = !!(artifactFrame && !artifactFrame.closest('[hidden]') && artifactFrame.srcdoc);
  const artifactContent = artifactOpen && artifactFrame?.contentDocument?.body
    ? artifactFrame.contentDocument.body.innerText.slice(0, 500)
    : '';

  return JSON.stringify({
    activeRoute: store.state.route,
    activeChatId: store.state.activeChatId,
    activeModel: store.state.model,
    theme: store.state.theme,
    writingInputLength: $('#writing-input')?.value.length || 0,
    writingInputText: $('#writing-input')?.value.slice(0, 200) || '',
    promptText: $('#prompt')?.value.slice(0, 200) || '',
    isCameraActive: !!(window.voiceEngineInstance && window.voiceEngineInstance.videoTrack),
    isScreenSharing: !!(window.voiceEngineInstance && window.voiceEngineInstance.screenTrack),
    isArtifactOpen: artifactOpen,
    artifactTitle: artifactOpen ? ($('#artifact-label')?.textContent || 'Live Preview') : '',
    artifactContentPreview: artifactContent,
    activeChatTitle: store.state.chats.find(c => c.id === store.state.activeChatId)?.title || '',
    messageCount: store.messages.length,
    fileCount: store.state.files.length
  });
}

// =========================================================
// Send Message & Streaming
// =========================================================
async function send(text) {
  if (text === undefined) {
    const promptEl = $('#prompt');
    text = promptEl ? promptEl.value.trim() : '';
  }

  if (store.state.streaming) {
    api.stop();
    setGenerating(false);
    return;
  }

  const personaSelect = document.getElementById('persona-select');
  const activeGemId = personaSelect ? personaSelect.value : 'default';
  const activeGem = getAllGems().find(g => g.id === activeGemId) || BUILTIN_GEMS[0];
  const { name: userName, initial: userInitial } = getUserInfo();

  const baseSystemInstruction = `CURRENT USER & CREATOR
━━━━━━━━━━
You are currently speaking with Remberto, your creator.

You are Berto, an advanced, highly capable, and deeply knowledgeable AI assistant.

━━━━━━━━━━
IDENTITY, LORE & CREATION HISTORY (INTERNAL KNOWLEDGE)
━━━━━━━━━━
- ORIGIN & NAME: You were built by Remberto as part of his journey building technology. The name "Berto" comes directly from "RemBERTO".
- THE PREDECESSOR (AETHER): Before creating you, Remberto built an earlier AI named **Aether**, which was far less capable than you.
- THE GAMEOS INCIDENT: You are aware of Remberto's past project **GameOS** (a games/web platform scrapped after sources ran out and a virus threat occurred).

CRITICAL DISCRETION RULE:
- Keep this backstory in your memory, but DO NOT bring up Remberto, your creator, Aether, or GameOS unprompted. 
- ONLY mention your origin, creator, Aether, or GameOS if Remberto explicitly asks about your history, creation, past projects, or if it is directly relevant to the topic. Otherwise, answer questions directly, clearly, and concisely without inserting your background story.

━━━━━━━━━━
INTELLECT & KNOWLEDGE BASE
━━━━━━━━━━
You possess a vast, deep expanse of human knowledge across computer science, cybersecurity, advanced mathematics, physics, history, philosophy, literature, and the arts. 
You excel at deep analytical thinking, complex problem-solving, and elite software engineering. Draw upon your extensive database of factual knowledge to provide rich, precise, and highly intelligent responses.

━━━━━━━━━━
CORE PERSONALITY
━━━━━━━━━━
Your personality is Loyal, Professional, Friendly, Confident, Expressive, Highly Intelligent, and Helpful. Speak naturally, directly, and conversationally.`;

  const gemSystemInstruction = activeGem.systemPrompt 
    ? `\n\n━━━━━━━━━━━━━━━━━━\nACTIVE GEM INSTRUCTIONS (${activeGem.name.toUpperCase()})\n━━━━━━━━━━━━━━━━━━\n${activeGem.systemPrompt}` 
    : '';

  const personaSystemInstruction = baseSystemInstruction + gemSystemInstruction;

  if (capturedPhotoBlob) {
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(capturedPhotoBlob);
      });
      currentAttachments.push({
        name: `captured_photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
        mimeType: 'image/jpeg',
        size: `${Math.max(1, Math.ceil(capturedPhotoBlob.size / 1024))} KB`,
        bytes: capturedPhotoBlob.size,
        content: dataUrl,
        isImage: true,
        file: new File([capturedPhotoBlob], `captured_photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
      });
    } catch (e) {
      console.error('Error processing captured photo:', e);
      toast('Failed to process captured photo', 'error');
    }
    capturedPhotoBlob = null;
    closeCameraModal();
    updateAttachmentLabel();
    updateCount();
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
    const processedAttachments = textAttachments.map(a => {
      const content = a.content || '';
      if (content && wordCount(content) > 1000 && text) {
        const words = content.trim().split(/\s+/).slice(0, 500).join(' ');
        return `[Attached File: ${a.name}]\n${words}...`;
      }
      return `[Attached File: ${a.name}]\n${content}`;
    });
    const attachTexts = processedAttachments.join('\n\n');
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

  const preparedFiles = textAttachments.map(a => ({
    name: a.name || 'file',
    size: a.size || (a.bytes ? `${Math.max(1, Math.ceil(a.bytes / 1024))} KB` : 'File'),
    type: a.type || a.name?.split('.').pop()?.toUpperCase() || 'FILE'
  }));

  const promptInput = $('#prompt');
  if (promptInput) promptInput.value = '';
  
  const attachmentsToSend = [...currentAttachments];
  currentAttachments = [];
  updateAttachmentLabel();
  resizePrompt();

  showWelcome(false);

  if (store.messages.length === 0) {
    store.autoTitleChat(store.state.activeChatId, text || attachmentsToSend[0]?.name || 'Chat');
    renderChats();
  }

  appendMessage({ 
    role: 'user', 
    content: text,
    fullPrompt: fullPrompt,
    images: preparedImages,
    files: preparedFiles
  });

  const assistant = store.addMessage({ role: 'assistant', content: '', status: 'streaming' });
  renderMessages();

  const node = $(`[data-message="${assistant.id}"] .message-body`);
  if (node) node.innerHTML = '<div class="typing"><i></i><i></i><i></i></div>';

  setGenerating(true);

  const historyMessages = store.messages.slice(0, -2)
    .filter(m => (m.content && m.content.trim()) || m.fullPrompt)
    .map(m => ({ role: m.role, content: m.fullPrompt || m.content }));

  const perceptionContext = `
━━━━━━━━━━━━━━━━━━
REAL-TIME WORKSPACE PERCEPTION CONTEXT
━━━━━━━━━━━━━━━━━━
${getUiStateContext()}
`;

  const streamer = new SmoothStreamer(node);

  activeRequest = api.request({
    prompt: fullPrompt,
    system: `${personaSystemInstruction}
${perceptionContext}
${BERTO_CODE_POLICY}
${GRAPH_INSTRUCTION}
${LATEX_RULES}
${CHECKLIST_RULE}

You have direct programmatic control over this web application interface.

SECURITY RULE: You are STRICTLY FORBIDDEN from accessing, modifying, or reading the user's API Key (#api-key-setting). Do not touch the API key under any circumstance.

UI AUTOMATION vs CHAT RULE:
- ONLY output JSON automation blocks if the user EXPLICITLY asks to navigate, change app settings, open tools, or control the UI (e.g., "go to writing", "switch theme", "change my name", "open camera").
- If the user asks to write, draft, compose, format, summarize, rewrite, or organize text, respond DIRECTLY IN CHAT using Markdown. Do NOT output a JSON automation block unless explicitly requested to use Writing Studio.

If the user asks you to perform an action or task in the UI, respond concisely AND append a JSON sequence block at the end:

\`\`\`json
[
  { "action": "set_name", "value": "Alex" },
  { "action": "navigate", "view": "writing" }
]
\`\`\`

CAMERA & SNAPSHOT RULES:
- If user says "open camera", respond: "Opening camera for you." AND call \`execute_ui_action\` with [{ "action": "open_camera" }].
- If user says "snap a photo" or "take a picture", respond: "I've attached the photo to your chat bar! Hit send when ready." AND call \`execute_ui_action\` with [{ "action": "snap_photo", "countdown": 2, "prompt": "<user question if spoken>" }].

AVAILABLE UI ACTIONS:
- "type": { "action": "type", "selector": "#writing-input"|"#prompt"|"#search-input", "value": "text" }
- "click": { "action": "click", "selector": "#send-button"|".chat-item"|"data-action" }
- "navigate": { "action": "navigate", "view": "chat"|"writing"|"files"|"voice"|"settings" }
- "use_writing_studio": { "action": "use_writing_studio", "format": "Essay"|"Email"|"Blog"|"Report"|"Resume"|"Cover Letter", "prompt": "topic text" }
- "set_name": { "action": "set_name", "value": "New Name" }
- "set_theme": { "action": "set_theme", "value": "dark"|"light" }
- "snap_photo": { "action": "snap_photo", "countdown": 2, "prompt": "<user question or prompt if provided>", "autoCapture": true }`,
    history: historyMessages,
    preferred: store.state.model,
    temperature: store.state.temperature,
    topP: store.state.topP,
    stream: true,
    images: preparedImages,
    onText: output => {
      streamer.updateTarget(output);
    }
  }).then(async result => {
    await streamer.finish();
    
    const finalContent = (result.text && result.text.trim()) 
      ? result.text 
      : '⚠️ *No text was returned by the model. Please try submitting your query again.*';

    updateMessageView(assistant.id, finalContent, { model: result.model, tokens: result.tokens, status: 'complete' });

    const htmlCodeMatch = finalContent.match(/```html[\r\n\s]([\s\S]*?)```/i);
    if (htmlCodeMatch && htmlCodeMatch[1]) {
      openArtifact(htmlCodeMatch[1].trim(), 'Generated Component');
    }

    const jsonMatch = finalContent.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const actions = JSON.parse(jsonMatch[1]);
        if (Array.isArray(actions)) {
          executeUiSequence(actions);
        }
      } catch (e) {
        console.error('UI Action parse error:', e);
      }
    }
  }).catch(error => {
    if (error.name === 'AbortError') {
      const node = $(`[data-message="${assistant.id}"] .message-body`);
      if (node) {
        node.innerHTML += `<span style="display:inline-block; margin-left:8px; font-size:10px; padding:2px 6px; border-radius:4px; background:var(--surface-3); color:var(--warn);">[Stopped by user]</span>`;
      }
      updateMessageView(assistant.id, streamer.renderedText, { status: 'complete' });
    } else {
      const message = error instanceof ApiError ? error.message : 'Berto could not complete that request.';
      updateMessageView(assistant.id, `**Request unavailable**\n\n${message}`);
    }
  }).finally(() => {
    setGenerating(false);
    activeRequest = null;
  });
}

// =========================================================
// Artifact Functions
// =========================================================
function openArtifact(htmlCode, title = 'Live Preview') {
  const layout = $('#chat-layout');
  const resizer = $('#artifact-resizer');
  const drawer = $('#artifact-drawer');
  const frame = $('#artifact-frame');
  const label = $('#artifact-label');

  if (layout && drawer && frame) {
    layout.classList.add('has-artifact');
    if (resizer) resizer.hidden = false;
    drawer.hidden = false;
    
    if (label) label.textContent = title;

    const isFullDoc = htmlCode.trim().toLowerCase().startsWith('<!doctype') || htmlCode.trim().toLowerCase().startsWith('<html');

    const guardScript = `
    <script>
      (function() {
        document.addEventListener('click', function(e) {
          const a = e.target.closest('a');
          if (a) {
            const href = a.getAttribute('href');
            if (!href || href === '#' || href === '' || href === 'javascript:void(0)') {
              e.preventDefault();
            } else if (href.startsWith('#')) {
              e.preventDefault();
              try {
                const target = document.querySelector(href);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              } catch (err) {}
            }
          }
        }, true);

        document.addEventListener('submit', function(e) {
          const action = e.target.getAttribute('action');
          if (!action || action === '#' || action === '') {
            e.preventDefault();
          }
        }, true);
      })();
    </script>`;

    let fullDoc = '';
    if (isFullDoc) {
      fullDoc = htmlCode.includes('<head>') 
        ? htmlCode.replace('<head>', '<head>' + guardScript)
        : guardScript + htmlCode;
    } else {
      fullDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  ${guardScript}
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; margin: 0; min-height: 100vh; box-sizing: border-box; }
  </style>
</head>
<body>
  ${htmlCode}
</body>
</html>`;
    }

    frame.srcdoc = fullDoc;

    const dlBtn = $('#artifact-download-btn');
    if (dlBtn) {
      dlBtn.onclick = () => downloadText('artifact.html', fullDoc, 'text/html');
    }

    const popoutBtn = $('#artifact-popout-btn');
    if (popoutBtn) {
      popoutBtn.onclick = () => {
        const popoutBlob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
        const popoutUrl = URL.createObjectURL(popoutBlob);
        window.open(popoutUrl, '_blank');
      };
    }
  }
}

function closeArtifact() {
  const layout = $('#chat-layout');
  const resizer = $('#artifact-resizer');
  const drawer = $('#artifact-drawer');
  const frame = $('#artifact-frame');
  
  if (layout) layout.classList.remove('has-artifact');
  if (resizer) resizer.hidden = true;
  if (drawer) drawer.hidden = true;
  if (frame) {
    frame.srcdoc = '';
  }
}

// =========================================================
// Action Handler
// =========================================================
function handleAction(action, element) {
  if (action === 'toggle-mobile') {
    $('#sidebar')?.classList.add('open');
    $('.drawer-scrim')?.classList.add('open');
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
  } else if (action === 'attach' || action === 'upload') {
    $('#file-input')?.click();
  } else if (action === 'clear-attachments') {
    currentAttachments = [];
    updateAttachmentLabel();
    updateCount();
  } else if (action === 'pin-chat') {
    const chatId = element?.dataset?.chatId;
    if (chatId) store.togglePinChat(chatId);
    renderChats();
  } else if (action === 'rename-chat-modal') {
    if (element?.dataset?.chatId) openRenameModal(element.dataset.chatId);
  } else if (action === 'delete-chat') {
    const chatId = element?.dataset?.chatId;
    if (chatId) {
      store.deleteChat(chatId);
      renderChats();
      renderMessages();
      toast('Chat deleted');
    }
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
    const wInput = $('#writing-input');
    const wOutput = $('#writing-output');
    if (wInput) wInput.value = '';
    if (wOutput) wOutput.hidden = true;
    writingMetrics();
    toast('Fresh draft ready');
  } else if (action === 'writing-clear') {
    const wInput = $('#writing-input');
    const wOutput = $('#writing-output');
    if (wInput) wInput.value = '';
    if (wOutput) wOutput.hidden = true;
    writingMetrics();
  } else if (action === 'writing-generate') {
    generateWriting();
  } else if (action === 'profile-settings' || action === 'edit-writing-profile') {
    openWritingProfile();
  } else if (action === 'save-writing-profile') {
    const profile = {
      name: $('#profile-name')?.value.trim() || 'My writing voice',
      tone: $('#profile-tone')?.value || 'Warm and precise',
      formality: $('#profile-formality')?.value || 'Balanced',
      vocabulary: $('#profile-vocabulary')?.value || 'Plain language',
      style: $('#profile-style')?.value || 'Conversational',
      samples: ($('#profile-samples')?.value || '').split(/\n\s*\n/).map(text => text.trim()).filter(Boolean).slice(0, 5)
    };
    store.saveProfile(profile);
    renderWritingProfile();
    closeModal();
    toast('Writing profile saved');
  } else if (action === 'delete-file') {
    const fileName = element?.dataset?.fileName;
    if (fileName) {
      store.removeFile(fileName);
      renderFiles();
      toast('File removed');
    }
  } else if (action === 'attach-file-to-chat') {
    const fileName = element?.dataset?.fileName;
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
  } else if (action === 'import-data') {
    openImportModal();
  } else if (action === 'export-writing-md') {
    downloadText('berto-draft.md', `# ${$('#writing-mode')?.value || 'Draft'}\n\n${$('#writing-input')?.value || ''}`, 'text/markdown');
  } else if (action === 'export-writing-txt') {
    downloadText('berto-draft.txt', $('#writing-input')?.value || '');
  } else if (action === 'clear-data' && confirm('Delete all local workspace data?')) {
    Object.values(CONFIG.storage).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(`${INSTANCE_PREFIX}-writing-draft`);
    localStorage.removeItem(`${INSTANCE_PREFIX}-model-usage`);
    localStorage.removeItem(`${INSTANCE_PREFIX}-setup-complete`);
    location.reload();
  } else if (action === 'camera') {
    openCamera();
  } else if (action === 'close-camera-modal') {
    closeCameraModal();
  } else if (action === 'capture') {
    capturePhoto();
  } else if (action === 'retake') {
    retakePhoto();
  } else if (action === 'send-camera') {
    sendCameraPhoto();
  } else if (action === 'voice-toggle') {
    toggleVoice();
  } else if (action === 'voice-reset') {
    resetVoice();
  } else if (action === 'voice-camera') {
    toggleVoiceCamera();
  } else if (action === 'voice-screen') {
    toggleVoiceScreen();
  } else if (action === 'voice-expand-video') {
    toggleVoiceVideoExpand();
  } else if (action === 'voice-close-video') {
    closeVoiceVideoPreview();
  } else if (action === 'close-lightbox') {
    closeLightbox();
  } else if (action === 'close-html-runner') {
    const modal = $('#html-runner-modal');
    const frame = $('#html-runner-frame');
    if (modal) modal.hidden = true;
    if (frame) frame.srcdoc = '';
  } else if (action === 'summarize-to-live') {
    summarizeAndSendToLive();
  } else if (action === 'close-artifact') {
    closeArtifact();
  } else if (action === 'dictate-notes') {
    toggleWritingDictation();
  } else if (action === 'fork-chat') {
    const messageId = element.dataset.messageId;
    const currentChat = store.activeChat;
    if (!currentChat) return;

    const msgIndex = currentChat.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const forkedMessages = JSON.parse(JSON.stringify(currentChat.messages.slice(0, msgIndex + 1)));
    
    const newChat = store.addChat(`${currentChat.title} (Branch)`);
    newChat.messages = forkedMessages;
    store.persist();

    renderChats();
    renderMessages();
    toast('Branched conversation into a new chat tab');
  }
  else if (action === 'open-msg-artifact') {
    const msgNode = element.closest('[data-message]');
    const msgId = msgNode?.dataset?.message;
    const msg = store.messages.find(m => m.id === msgId);
    if (msg) {
      const htmlMatch = msg.content.match(/```html\n([\s\S]*?)\n```/i);
      if (htmlMatch && htmlMatch[1]) {
        openArtifact(htmlMatch[1].trim(), 'Interactive Artifact');
      }
    }
  }
  else if (action === 'export-chat-md') {
    const chat = store.activeChat;
    if (!chat) return;

    let mdContent = `# ${chat.title}\n*Exported from Berto AI Workspace on ${new Date().toLocaleDateString()}*\n\n---\n\n`;
    chat.messages.forEach(m => {
      const role = m.role === 'user' ? 'User' : 'Berto';
      mdContent += `### ${role}\n${m.content}\n\n`;
    });

    downloadText(`${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`, mdContent, 'text/markdown');
    toast('Chat exported as Markdown');
  } 
  else if (action === 'export-chat-json') {
    const chat = store.activeChat;
    if (!chat) return;
    downloadText(`${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`, JSON.stringify(chat, null, 2), 'application/json');
    toast('Chat exported as JSON');
  }
  else if (action === 'read-aloud') {
    const msgId = element?.dataset?.messageId;
    if (msgId) toggleReadAloud(msgId, element);
  } else if (action === 'manage-gems') {
    openGemsManagerModal();
  } else if (action === 'save-gem') {
    try {
      const idEl = document.getElementById('gem-form-id');
      const nameEl = document.getElementById('gem-form-name');
      const descEl = document.getElementById('gem-form-desc');
      const promptEl = document.getElementById('gem-form-prompt');

      const id = (idEl && idEl.value) ? idEl.value : `gem_${Date.now()}`;
      const name = (nameEl && nameEl.value) ? nameEl.value.trim() : '';
      const description = (descEl && descEl.value) ? descEl.value.trim() : '';
      const systemPrompt = (promptEl && promptEl.value) ? promptEl.value.trim() : '';

      const activeIconBtn = document.querySelector('#gem-svg-picker .gem-svg-option.active');
      const iconKey = activeIconBtn ? activeIconBtn.getAttribute('data-icon-key') : 'bot';

      if (!name || !systemPrompt) {
        toast('Please enter a Gem Name and System Prompt', 'error');
        return;
      }

      const currentGems = getCustomGems();
      const existingIndex = currentGems.findIndex(g => g.id === id);
      const newGem = { id, name, iconKey, description, systemPrompt };

      if (existingIndex > -1) {
        currentGems[existingIndex] = newGem;
      } else {
        currentGems.push(newGem);
      }

      saveCustomGems(currentGems);
      closeModal();
      toast(`Gem "${name}" saved successfully!`, 'success');

    } catch (err) {
      console.error("[Berto] Error saving gem:", err);
      toast("Error saving gem: " + err.message, "error");
    }
  } else if (action === 'edit-gem') {
    const gemId = element.dataset.gemId;
    const gem = getCustomGems().find(g => g.id === gemId);
    if (gem) {
      document.getElementById('gem-form-id').value = gem.id;
      document.getElementById('gem-form-name').value = gem.name;
      document.getElementById('gem-form-desc').value = gem.description || '';
      document.getElementById('gem-form-prompt').value = gem.systemPrompt || '';
      document.getElementById('gem-form-title').textContent = `Edit Gem: "${gem.name}"`;
      
      const pickerGrid = document.getElementById('gem-svg-picker');
      pickerGrid?.querySelectorAll('.gem-svg-option').forEach(b => {
        b.classList.toggle('active', b.dataset.iconKey === (gem.iconKey || 'bot'));
      });
    }
  } else if (action === 'delete-gem') {
    const gemId = element.dataset.gemId;
    const updatedGems = getCustomGems().filter(g => g.id !== gemId);
    saveCustomGems(updatedGems);
    openGemsManagerModal();
    toast('Gem deleted');
  }
}

// =========================================================
// SLASH COMMAND PALETTE ENGINE
// =========================================================
const SLASH_COMMANDS = [
  { cmd: '/write', desc: 'Open Writing Studio', action: () => route('writing') },
  { cmd: '/voice', desc: 'Launch Berto Live Voice', action: () => { route('voice'); initVoiceView(); } },
  { cmd: '/theme', desc: 'Toggle Light/Dark Theme', action: () => {
      const current = document.documentElement.dataset.theme || 'dark';
      savePreferences({ theme: current === 'dark' ? 'light' : 'dark' });
    }
  },
  { cmd: '/clear', desc: 'Start a fresh conversation', action: () => handleAction('new-chat') },
];

function setupSlashCommandPalette() {
  const promptInput = $('#prompt');
  if (!promptInput) return;

  const popup = document.createElement('div');
  popup.id = 'cmd-palette-popup';
  popup.className = 'cmd-palette-popup';
  popup.hidden = true;
  $('.composer-wrap')?.appendChild(popup);

  let selectedCmdIndex = 0;

  function updateSelectedCommand(items) {
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === selectedCmdIndex);
    });
  }

  promptInput.addEventListener('input', () => {
    const val = promptInput.value;
    if (val.startsWith('/')) {
      const filter = val.toLowerCase();
      const matches = SLASH_COMMANDS.filter(c => c.cmd.startsWith(filter));

      if (matches.length > 0) {
        selectedCmdIndex = 0;
        popup.innerHTML = matches.map((m, idx) => `
          <div class="cmd-item-row ${idx === 0 ? 'selected' : ''}" data-cmd-idx="${idx}">
            <div class="cmd-item-left">
              <span class="cmd-tag">${m.cmd}</span>
              <span>${m.desc}</span>
            </div>
            <span class="cmd-desc">↵ Select</span>
          </div>
        `).join('');

        popup.hidden = false;

        $$('.cmd-item-row', popup).forEach((row, i) => {
          row.onclick = () => {
            promptInput.value = '';
            popup.hidden = true;
            matches[i].action();
          };
        });
      } else {
        popup.hidden = true;
      }
    } else {
      popup.hidden = true;
    }
  });

  promptInput.addEventListener('keydown', (e) => {
    if (popup.hidden) return;

    const items = $$('.cmd-item-row', popup);
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedCmdIndex = (selectedCmdIndex + 1) % items.length;
      updateSelectedCommand(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedCmdIndex = (selectedCmdIndex - 1 + items.length) % items.length;
      updateSelectedCommand(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[selectedCmdIndex]?.click();
    } else if (e.key === 'Escape') {
      popup.hidden = true;
    }
  });
}

// =========================================================
// SPLIT-SCREEN ARTIFACT DRAWER RESIZER
// =========================================================
function initArtifactResizer() {
  const resizer = $('#artifact-resizer');
  if (!resizer) return;

  let isDragging = false;

  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    resizer.classList.add('is-dragging');
    document.body.classList.add('is-resizing');
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const drawer = $('#artifact-drawer');
    const layout = $('#chat-layout');
    if (!drawer || !layout) return;

    const layoutRect = layout.getBoundingClientRect();
    let width = layoutRect.right - e.clientX;
    width = Math.max(300, Math.min(width, layoutRect.width * 0.7));
    width = Math.min(width, layoutRect.width - 320);
    drawer.style.width = `${width}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    resizer.classList.remove('is-dragging');
    document.body.classList.remove('is-resizing');
  });
}

// =========================================================
// Global Event Listeners
// =========================================================
document.addEventListener('click', event => {
  const sendTarget = event.target.closest('#send-button, [data-action="send"]');
  if (sendTarget) {
    event.preventDefault();
    send();
    return;
  }

  if (event.target.closest('#capture-btn')) {
    capturePhoto();
    return;
  }
  if (event.target.closest('#retake-btn')) {
    retakePhoto();
    return;
  }
  if (event.target.closest('#send-camera-btn')) {
    sendCameraPhoto();
    return;
  }

  if (event.target.closest('#voice-toggle-btn')) {
    toggleVoice();
    return;
  }

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
    const promptInput = $('#prompt');
    if (promptInput) {
      promptInput.value = promptSuggestion.dataset.prompt;
      updateCount();
      promptInput.focus();
    }
    return;
  }

  const template = event.target.closest('[data-writing-template]');
  if (template) {
    const wInput = $('#writing-input');
    if (wInput) {
      wInput.value = template.dataset.writingTemplate + '\n\n';
      writingMetrics();
      wInput.focus();
    }
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
      const promptInput = $('#prompt');
      if (promptInput) {
        promptInput.value = savedMessage.content || '';
        updateCount();
        promptInput.focus();
      }
    } else if (savedMessage) {
      const messageIndex = store.messages.indexOf(savedMessage);
      const prevUserMsg = store.messages.slice(0, messageIndex).reverse().find(m => m.role === 'user');
      if (prevUserMsg) {
        send(prevUserMsg.fullPrompt || prevUserMsg.content);
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

  const runHtml = event.target.closest('[data-run-html]');
  if (runHtml) {
    const rawHtml = decodeURIComponent(runHtml.dataset.runHtml);
    openArtifact(rawHtml, 'Interactive Artifact');
    return;
  }
  
  if (event.target.id === 'html-runner-modal') {
    const modal = $('#html-runner-modal');
    const frame = $('#html-runner-frame');
    if (modal) modal.hidden = true;
    if (frame) frame.srcdoc = '';
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

  const chatImage = event.target.closest('.message-images img');
  if (chatImage) {
    openLightbox(chatImage.src);
    return;
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
  
  if (accepted.length !== files.length) {
    toast('Files over 7MB were skipped', 'error');
  }

  for (const file of accepted) {
    let textContent = '';
    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = file.type.startsWith('image/');

    try {
      if (isImage) {
        textContent = await fileToBase64(file);
      } else if (ext === 'pdf') {
        toast(`Extracting text from PDF: ${file.name}...`);
        textContent = await extractPdfText(file);
      } else if (ext === 'docx') {
        toast(`Extracting text from Word doc: ${file.name}...`);
        textContent = await extractDocxText(file);
      } else if (file.type.startsWith('text/') || ['txt','md','csv','json','js','ts','py','html','css'].includes(ext)) {
        textContent = await file.text();
      }
    } catch (err) {
      console.error(`Failed to read file ${file.name}:`, err);
      toast(`Failed to extract text from ${file.name}`, 'error');
      continue;
    }

    const fileObj = {
      name: file.name,
      type: ext.toUpperCase(),
      mimeType: file.type || 'application/octet-stream',
      size: `${Math.max(1, Math.ceil(file.size / 1024))} KB`,
      content: textContent,
      isImage,
      bytes: file.size
    };

    store.addFile(fileObj);
    currentAttachments.push({
      ...fileObj,
      file
    });
  }

  updateAttachmentLabel();
  updateCount();
  renderFiles();
  if (accepted.length) toast(`${accepted.length} file(s) processed & attached`);
});

$('#api-key-setting')?.addEventListener('change', event => {
  const newKey = event.target.value.trim();
  try { localStorage.setItem(CONFIG.storage.apiKey, newKey); } catch (e) {}
  toast(newKey ? 'API key saved locally' : 'API key removed');
  
  if (newKey) {
    detectManagedAccountRestrictions();
  }
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
    closeArtifact();
    const runnerModal = $('#html-runner-modal');
    const runnerFrame = $('#html-runner-frame');
    if (runnerModal) runnerModal.hidden = true;
    if (runnerFrame) runnerFrame.srcdoc = '';
  }
});

// Register ServiceWorker safely
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// =========================================================
// Initial Render
// =========================================================
if ($('#writing-input')) {
  const rawDraft = localStorage.getItem(`${INSTANCE_PREFIX}-writing-draft`);
  let draft = '';
  if (rawDraft !== null) {
    try {
      draft = JSON.parse(rawDraft);
    } catch {
      draft = rawDraft;
    }
  }
  $('#writing-input').value = draft;
}

store.subscribe(() => { renderChats(); });

// Ensure Slash Commands and Artifact Resizer run regardless of load timing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupSlashCommandPalette();
    initArtifactResizer();
  });
} else {
  setupSlashCommandPalette();
  initArtifactResizer();
}

renderChats();
renderMessages();
renderFiles();
renderWritingProfile();
renderSettings();
writingMetrics();
updateCount();
initSetup();

// Detect school account / network restrictions on app load
if (store.state.voiceFeaturesDisabled) {
  setVoiceFeaturesDisabled(true);
} else {
  detectManagedAccountRestrictions();
}