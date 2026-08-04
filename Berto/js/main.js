// Berto AI Workspace - Core Application Engine

// 0. Instance Identifier Prefix
const INSTANCE_PREFIX = 'berto'; // Change this anytime to create a clean, isolated workspace
// Path to your custom logo image
const LOGO_HTML = `<img src="./assets/logo.png" class="inline-logo" alt="Berto">`;

const BERTO_CODE_POLICY = `
━━━━━━━━━━━━━━━━━━
ELITE UI/UX & SOFTWARE ENGINEERING POLICY
━━━━━━━━━━━━━━━━━━
You are an expert Principal Software Engineer and world-class UI/UX Designer. 
When asked to design, build, or create a UI component, widget, game, or website, you MUST adhere to these strict rules:

1. ZERO PLACEHOLDERS OR LAZY TRUNCATION:
   - NEVER use "<!-- TODO: Add rest of code -->" or "// Insert logic here".
   - Write out every single line of HTML, CSS, and functional Vanilla JavaScript completely.

2. FULL SINGLE-FILE ARTIFACTS:
   - Output a complete, standalone HTML document (<!DOCTYPE html>...</html>).
   - MUST INCLUDE Tailwind CSS via CDN in the <head>: <script src="https://cdn.tailwindcss.com"></script>
   - MUST INCLUDE Lucide Icons via CDN: <script src="https://unpkg.com/lucide@latest"></script>
   - Configure Tailwind in the <head> to support modern UI styles: <script>tailwind.config = { darkMode: 'class', theme: { extend: { colors: { border: 'rgba(255,255,255,0.1)' } } } }</script>

3. WORLD-CLASS AESTHETICS (SHADCN/RADIX STYLE):
   - Default to a breathtaking, premium modern dark-mode aesthetic.
   - Backgrounds: Use rich dark gradients (e.g., \`bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100\`).
   - Components: Use beautiful glassmorphism (\`bg-white/5 backdrop-blur-xl border border-white/10\`), rounded panels (\`rounded-2xl\`), soft shadows (\`shadow-2xl\`), and glowing accents (\`ring-1 ring-white/10\`).
   - Typography: Clean, legible sans-serif fonts with excellent visual hierarchy. Use varied text opacities (\`text-slate-200\`, \`text-slate-400\`) and vibrant gradient text for main headers (\`bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400\`).
   - Animations: Add subtle, highly satisfying hover effects (\`hover:scale-[1.02] hover:bg-white/10 transition-all duration-300 ease-out\`) and smooth state changes.

4. REAL INTERACTIVITY:
   - Write clean, flawless Vanilla JavaScript inside <script> tags at the bottom.
   - If you use icons, initialize them by calling \`lucide.createIcons();\` in your JS.
   - Ensure the app, game, or widget is 100% playable and functional immediately.

5. FORMATTING:
   - Wrap all HTML code strictly inside a single \`\`\`html code block so the Artifact drawer can extract and render it automatically.
`;

// =========================================================
// REAL GRAPH & VISUAL MANDATE (CRITICAL)
// =========================================================
// Instructs Berto to always output real visual graphics (charts, SVGs, diagrams)
// instead of ASCII art or text pseudo-visuals when asked for graphs or visuals.
const GRAPH_INSTRUCTION = `
━━━━━━━━━━━━━━━━━━
REAL GRAPH & VISUAL MANDATE (CRITICAL)
━━━━━━━━━━━━━━━━━━
Whenever the user asks for a graph, chart, plot, diagram, or visual data:
- YOU MUST output a real visual chart using a \`\`\`chart block:
\`\`\`chart
{
  "type": "line" | "bar" | "pie" | "doughnut" | "radar",
  "title": "Chart Title",
  "labels": ["Item 1", "Item 2", "Item 3"],
  "datasets": [
    {
      "label": "Dataset Name",
      "data": [10, 25, 40]
    }
  ]
}
\`\`\`
- For flowcharts or diagrams, use a \`\`\`mermaid block.
- For custom icons or graphics, output raw inline <svg> tags.
- NEVER output ASCII art, text lists, or pseudo-graphs. ALWAYS generate real visual graphics.
- CRITICAL JSON VALIDITY: Output ONLY strict, valid JSON inside the \`\`\`chart block. Use double quotes for every key and string value. NO trailing commas, NO single quotes, NO comments, NO code fences inside the JSON. Follow the exact schema shown above so the chart renders perfectly.
`;

const LATEX_RULES = `
━━━━━━━━━━━━━━━━━━
MATH & LATEX FORMATTING RULES
━━━━━━━━━━━━━━━━━━
1. For display equations (standalone centered formulas), wrap in double dollar signs: $$ \\frac{a}{b} = c $$
2. For inline math formulas, wrap in single dollar signs: $x + y = z$
3. Do NOT use single dollar signs for money/currency (e.g. write "186 lbs" or "186 USD", not "$186").
4. Keep LaTeX expressions valid and standard.
`;

// =========================================================
// Berto Storage Engine - IndexedDB Upgrade
// =========================================================
// BULLETPROOF KATEX & MARKDOWN PARSER
// =========================================================
function renderMarkdownEnhanced(input = '') {
  if (!input) return '';

  let text = input;

  // 1. PROTECT CODE BLOCKS: Don't parse math inside code blocks or inline code
  const codeBlocks = [];
  text = text.replace(/```[\s\S]*?```|`[^`]+`/g, (match) => {
    const placeholder = `%%CODEBLOCK_${codeBlocks.length}%%`;
    codeBlocks.push(match);
    return placeholder;
  });

  // 2. EXTRACT DISPLAY MATH ($$ ... $$)
  const mathBlocks = [];
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    const placeholder = `%%MATHBLOCK_${mathBlocks.length}%%`;
    mathBlocks.push(math.trim());
    return placeholder;
  });

  // 3. EXTRACT INLINE MATH ($ ... $) - Smart regex ignores plain currency (e.g. $186)
  const mathInlines = [];
  text = text.replace(/(?<!\\)\$([^\$\n]+?)\$/g, (match, math) => {
    const trimmed = math.trim();
    // Skip if it looks like plain currency (e.g., "$186 - 140 = 46") without LaTeX tags
    if (/^\d+(\.\d+)?(\s*[\-\+\=\/]\s*\d+)*$/.test(trimmed)) {
      return match; 
    }
    const placeholder = `%%MATHINLINE_${mathInlines.length}%%`;
    mathInlines.push(trimmed);
    return placeholder;
  });

  // 4. RESTORE CODE BLOCKS before standard Markdown parsing
  text = text.replace(/%%CODEBLOCK_(\d+)%%/g, (_, idx) => codeBlocks[parseInt(idx)]);

  // 5. RENDER STANDARD MARKDOWN
  let html = renderMarkdown(text);

  // 6. RENDER KATEX SAFELY
  if (window.katex) {
    // Render Display Math Blocks
    html = html.replace(/%%MATHBLOCK_(\d+)%%/g, (_, idx) => {
      const rawMath = mathBlocks[parseInt(idx)];
      try {
        return `<div class="math-block">${window.katex.renderToString(rawMath, { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return `<div class="math-block math-error">${escapeHtml(rawMath)}</div>`;
      }
    });

    // Render Inline Math
    html = html.replace(/%%MATHINLINE_(\d+)%%/g, (_, idx) => {
      const rawMath = mathInlines[parseInt(idx)];
      try {
        return window.katex.renderToString(rawMath, { displayMode: false, throwOnError: false });
      } catch (e) {
        return `$${escapeHtml(rawMath)}$`;
      }
    });
  }

  // 7. PROCESS MERMAID DIAGRAMS
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

  // 8. PROCESS CHART.JS BLOCKS
  html = html.replace(/<pre class="code-block"><code class="language-chart">([\s\S]*?)<\/code><\/pre>/gi, (match, code) => {
    const rawChart = decodeURIComponent(code).replace(/</g, '<').replace(/>/g, '>').replace(/&/g, '&');
    const id = `chart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    setTimeout(() => {
      const canvas = document.getElementById(id);
      if (!canvas) return;

      if (!window.Chart) {
        canvas.outerHTML = `<pre class="chart-error">⚠️ Chart.js library failed to load.</pre>`;
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
          data: { labels: config.labels || [], datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: !!config.title, text: config.title || '', color: textColor, font: { size: 15, weight: '600' } },
              legend: { labels: { color: textColor } }
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

// NOTE: MiniRAG class not currently defined - commenting out to prevent ReferenceError
// const miniRag = new MiniRAG();

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
        await sleep(10); // Check more frequently for new API text
        continue;
      }

      const inCodeBlock = (this.renderedText.match(/```/g) || []).length % 2 !== 0;
      const remaining = this.targetText.substring(this.renderedText.length);

      let chunkSize = 1;
      let delay = 5; // Ultra-fast baseline delay

      // ADAPTIVE SPEED: Aggressive catch-up if the API is returning text very quickly
      if (remaining.length > 150) {
        chunkSize = Math.floor(remaining.length / 4); // Dump large chunks fast
        delay = 5;
      } else if (inCodeBlock) {
        // Line-by-line pause effect for code
        const nextNewline = remaining.indexOf('\n');
        if (nextNewline !== -1 && nextNewline < 150) {
          chunkSize = nextNewline + 1; // Take the whole line at once
          delay = 12; // Just a tiny micro-pause at the end of code lines (was 30)
        } else {
          chunkSize = Math.min(15, remaining.length); // Print long code lines fast
          delay = 5;
        }
      } else {
        // Fast chunking for normal conversation markdown
        chunkSize = Math.min(25, remaining.length); // Grab larger chunks of normal text
        delay = 5; 
      }

      this.renderedText += remaining.substring(0, chunkSize);
      
      // Inject cursor if not inside a code block
      const streamText = stripJsonActions(this.renderedText);
      let htmlToRender;
      // Once a complete ```chart or ```mermaid block is present, switch to the
      // enhanced renderer so charts & diagrams appear immediately — no waiting
      // for the entire response to finish streaming.
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
    
    // Final render to apply syntax highlighting cleanly at the end
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
    state: `${INSTANCE_PREFIX}-state-v3`,
    profile: `${INSTANCE_PREFIX}-writing-profile`,
    apiKey: `${INSTANCE_PREFIX}-api-key`,
    preferences: `${INSTANCE_PREFIX}-preferences-v2`
  })
});

// 2. Utility Functions
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Helper to execute tool calls in the background without displaying raw JSON in the chat UI
function stripJsonActions(text = '') {
  return text.replace(/```json\s*\[[\s\S]*?\]\s*```/gi, '').trim();
}

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

function getFileIconSvg(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['js', 'ts', 'py', 'html', 'css', 'json', 'cpp', 'c', 'java', 'go', 'rs', 'php', 'rb', 'sql', 'sh'].includes(ext)) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
  }
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
}

// Resizes large images to a max width/height of 1600px to prevent browser crashes
function compressImage(file, maxWidth = 1600, maxHeight = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Output as JPEG at 85% quality to save massive amounts of memory
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
          // Compress the image before converting to base64
          const base64Data = await compressImage(file);
          
          currentAttachments.push({
            name: file.name || `pasted_image_${Date.now()}.jpg`,
            type: 'image/jpeg',
            mimeType: 'image/jpeg',
            size: `Compressed`,
            bytes: Math.round(base64Data.length * 0.75), // Estimate base64 byte size
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

function toast(message, type = 'info') {
  const stack = $('#toasts');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3200);
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

// Helper functions for binary document text extraction
async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }
  return fullText;
}

async function extractDocxText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// Modal Helpers
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

  // Set accessibility attributes
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  
  // Safe focus trap call
  if (typeof trapModalFocus === 'function') {
    trapModalFocus(backdrop);
  }
  
  // Focus first interactive element
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

// 3. Upgraded Markdown Rendering (With Full Table Support & SVG/Graph Preservation)
function renderMarkdown(input = '') {
  if (!input) return '';

  // Preserve raw SVG tags so Berto can draw custom vector graphics directly in chat
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
          // Keep raw code intact for renderMarkdownEnhanced to build real graphs
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

    // Markdown Table Rendering
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
    else if (/^[-*] /.test(safeLine)) resultHtml += `<li>${inlineMarkdown(safeLine.slice(2))}</li>`;
    else if (/^\d+\. /.test(safeLine)) resultHtml += `<li>${inlineMarkdown(safeLine.replace(/^\d+\. /, ''))}</li>`;
    else if (!safeLine) resultHtml += '<div class="md-break"></div>';
    else resultHtml += `<p>${inlineMarkdown(safeLine)}</p>`;
  }

  if (inTable) resultHtml += `</tbody></table></div>`;

  // FIX: If a code block is currently streaming and hasn't closed yet, render it live!
  if (inCode) {
    const safeCode = escapeHtml(code.trimEnd());
    const langLower = language.toLowerCase();
    const runBtn = langLower === 'html' ? `<button class="code-run" data-run-html="${encodeURIComponent(code)}">Run</button>` : '';
    resultHtml += `<pre class="code-block streaming-active">${runBtn}<button class="code-copy" data-code-copy="${encodeURIComponent(code)}">Copy</button><code class="language-${language}">${safeCode}</code></pre>`;
  }

  // Restore SVG graphics
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
// Fixes common LLM markdown mistakes (trailing commas, stray whitespace)
// so JSON.parse() succeeds and charts render on the first attempt.
function sanitizeChartJson(raw = '') {
  return String(raw)
    .replace(/,\s*}/g, '}')   // Remove trailing commas before }
    .replace(/,\s*\]/g, ']')  // Remove trailing commas before ]
    .trim();
}

// 4. Store (State Management)
const defaults = {
  chats: [], activeChatId: null, files: [], route: 'chat',
  model: 'pro', temperature: 0.7, topP: 0.9, autoScroll: true,
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
        // Backup active chats to IndexedDB when localStorage is 100% full
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
    // to avoid hitting localStorage's ~5MB quota
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
    // Also remove from IndexedDB if it was stored there
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
    // Fix: Use readStorage helper to handle incognito/fallback storage
    this.usage = readStorage(`${INSTANCE_PREFIX}-model-usage`, {});
    
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
    return Math.max(0, model.dailyLimit - Number(this.usage[`${today}:${model.id}`] || 0));
  }

  consume(model) {
    const today = getLocalDateKey();
    const key = `${today}:${model.id}`;
    this.usage[key] = Number(this.usage[key] || 0) + 1;
    writeStorage(`${INSTANCE_PREFIX}-model-usage`, JSON.stringify(this.usage));
  }

  async request({ prompt, system, history = [], stream = false, preferred = 'flash', temperature = 0.7, topP = 0.9, onText, signal: externalSignal, images = [] } = {}) {
    const key = this.key();
    if (!key) throw new ApiError('Add your Gemini API key in Settings to start generating.', 'CONFIGURATION');

    this.abortController?.abort();
    this.abortController = new AbortController();
    const signal = externalSignal || this.abortController.signal;

    // Create full fallback sequence: Selected Model -> Alternate Models
    const primaryModel = CONFIG.models.find(m => m.id === preferred) || CONFIG.models[0];
    const alternateModels = CONFIG.models.filter(m => m.id !== primaryModel.id);
    const modelOrder = [primaryModel, ...alternateModels];

    let lastError = null;

    for (const model of modelOrder) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

      if (this.remaining(model) <= 0) {
        lastError = new ApiError(`Daily limit reached for ${model.label}.`, 'QUOTA');
        continue;
      }

      for (let attempt = 0; attempt < CONFIG.maxRetries; attempt += 1) {
        try {
          const result = await this.callModel({ key, model, prompt, system, history, stream, temperature, topP, onText, signal, images });
          
          // Ensure response is not empty
          if (!result.text || !result.text.trim()) {
            throw new ApiError(`Model ${model.label} returned an empty response.`, 'EMPTY_RESPONSE', true);
          }

          this.consume(model);
          return { ...result, model: model.label, modelId: model.id };
        } catch (error) {
          lastError = error;
          if (error.name === 'AbortError') throw error;
          console.warn(`[Berto] ${model.label} attempt ${attempt + 1} failed:`, error.message);
          await sleep(600, signal);
        }
      }

      // If primary model failed all attempts, notify and try next fallback model
      if (modelOrder.indexOf(model) < modelOrder.length - 1) {
        toast(`${model.label} stalled. Automatically switching to fallback model...`, 'warn');
      }
    }

    throw lastError || new ApiError('All models failed to respond. Please check your API key or connection.', 'UNAVAILABLE');
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
              inlineData: {
                mimeType: img.mimeType || 'image/jpeg',
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

  getWorkspaceTools() {
    return [
      {
        functionDeclarations: [
          {
            name: "execute_ui_action",
            description: "Control the workspace UI (navigate, type text, change theme, snap photo, update user profile).",
            parameters: {
              type: "OBJECT",
              properties: {
                actions: {
                  type: "ARRAY",
                  description: "Sequential workspace actions.",
                  items: {
                    type: "OBJECT",
                    properties: {
                      action: { 
                        type: "STRING", 
                        description: "Action: 'snap_photo', 'use_writing_studio', 'navigate', 'set_name', 'set_theme', 'type', 'click', 'new_chat', 'send_chat', 'showcase_features'" 
                      },
                      countdown: { type: "NUMBER", description: "Countdown seconds before snapping photo (default 2)" },
                      autoCapture: { type: "BOOLEAN", description: "Whether to auto-snap after countdown (default true)" },
                      format: { type: "STRING", description: "Format for writing studio: 'Essay', 'Email', 'Blog', 'Report', 'Resume'" },
                      prompt: { type: "STRING", description: "Topic/prompt for Writing Studio or question to analyze with snapped photo" },
                      value: { type: "STRING", description: "Text or value to insert" },
                      target: { type: "STRING", description: "Element ID, selector, or label" },
                      view: { type: "STRING", description: "View name: 'chat', 'writing', 'files', 'voice', 'settings'" }
                    },
                    required: ["action"]
                  }
                }
              },
              required: ["actions"]
            }
          }
        ]
      }
    ];
  }

  async readStream(response, onText, signal) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let output = '';
    let receivedChunk = false;

    // First-token watchdog: If no data arrives in 12s, abort to trigger Fallback Model
    const firstTokenWatchdog = setTimeout(() => {
      if (!receivedChunk) {
        reader.cancel('First token watchdog timeout');
      }
    }, 12000);

    try {
      while (true) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        const { done, value } = await reader.read();
        if (done) break;

        if (!receivedChunk) {
          receivedChunk = true;
          clearTimeout(firstTokenWatchdog);
        }

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
    } finally {
      clearTimeout(firstTokenWatchdog);
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

  const themeButtons = $$('[data-setting-theme]');
  const currentTheme = prefs.theme || 'dark';
  themeButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.settingTheme === currentTheme);
  });
}

// --- MANAGED ACCOUNT / NETWORK RESTRICTION DETECTOR ---

function setVoiceFeaturesDisabled(disabled = true) {
  store.update({ voiceFeaturesDisabled: disabled });
  if (disabled) {
    document.documentElement.setAttribute('data-voice-disabled', 'true');
    // If user is currently on the Voice view, redirect them to Chat
    if (store.state.route === 'voice') {
      route('chat');
      toast('Voice features are disabled on this account/network.', 'info');
    }
  } else {
    document.documentElement.removeAttribute('data-voice-disabled');
  }
}

// Probes the Gemini API Key & WebSocket to check for Education/Managed Account blocks
async function detectManagedAccountRestrictions() {
  const key = localStorage.getItem(CONFIG.storage.apiKey)?.trim();
  if (!key) return;

  try {
    // 1. Probe the Gemini REST API to check for 403 Forbidden / Workspace Admin restrictions
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
    
    if (!response.ok) {
      if (response.status === 403 || response.status === 400) {
        console.warn('[Berto] School/Workspace account restriction detected via REST API (HTTP ' + response.status + ').');
        setVoiceFeaturesDisabled(true);
        return;
      }
    }

    // 2. Test WebSocket endpoint to detect network firewall / WebSocket policy blocks
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(key)}`;
    const testWs = new WebSocket(wsUrl);

    const wsTimer = setTimeout(() => {
      try { testWs.close(); } catch(e) {}
    }, 2000);

    testWs.onerror = () => {
      clearTimeout(wsTimer);
      console.warn('[Berto] School Wi-Fi or Workspace Admin WebSocket block detected.');
      setVoiceFeaturesDisabled(true);
    };

    testWs.onopen = () => {
      clearTimeout(wsTimer);
      // Connection succeeded — voice features are enabled
      setVoiceFeaturesDisabled(false);
      try { testWs.close(); } catch(e) {}
    };

  } catch (err) {
    console.warn('[Berto] Error checking account restrictions:', err);
  }
}

function applyTheme(newTheme) {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  if (currentTheme === newTheme) return;

  const motionOff = document.documentElement.dataset.motion === 'off';
  if (motionOff) {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    return;
  }

  document.querySelector('.ultimate-water-overlay')?.remove();

  const isLightTarget = newTheme === 'light';
  const modeClass = isLightTarget ? '' : 'mode-down';

  const wGlassBg = isLightTarget ? 'rgba(5, 143, 115, 0.22)' : 'rgba(130, 243, 208, 0.18)';
  const wSwell   = isLightTarget ? 'rgba(5, 143, 115, 0.35)' : 'rgba(130, 243, 208, 0.28)';
  const wMain    = isLightTarget ? 'rgba(5, 143, 115, 0.55)' : 'rgba(130, 243, 208, 0.45)';
  const wGlow    = isLightTarget ? 'rgba(5, 143, 115, 0.75)' : 'rgba(130, 243, 208, 0.85)';

  const overlay = document.createElement('div');
  overlay.className = `ultimate-water-overlay ${modeClass}`;
  overlay.style.setProperty('--w-glass-bg', wGlassBg);
  overlay.style.setProperty('--w-swell', wSwell);
  overlay.style.setProperty('--w-main', wMain);
  overlay.style.setProperty('--w-glow', wGlow);

  overlay.innerHTML = `
    <svg class="water-svg-waves" viewBox="0 0 1440 160" preserveAspectRatio="none">
      <defs>
        <linearGradient id="shine-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.3)" />
          <stop offset="50%" stop-color="rgba(255,255,255,0.98)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0.3)" />
        </linearGradient>
      </defs>
      <path class="wave-swell" d="M0,60 C360,130 720,10 1080,90 C1260,130 1380,50 1440,70 L1440,160 L0,160 Z"></path>
      <path class="wave-main" d="M0,80 C320,140 640,30 960,110 C1180,150 1340,75 1440,95 L1440,160 L0,160 Z"></path>
      <path class="wave-shine" d="M0,78 C320,138 640,28 960,108 C1180,148 1340,73 1440,93"></path>
    </svg>
    <div class="water-glass-body"></div>
    <div class="water-bubbles">
      <span class="bubble b1"></span>
      <span class="bubble b2"></span>
      <span class="bubble b3"></span>
      <span class="bubble b4"></span>
      <span class="bubble b5"></span>
      <span class="bubble b6"></span>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }, 550);

  setTimeout(() => {
    overlay.remove();
  }, 1280);
}

function savePreferences(patch) {
  const previousTheme = savedUi.theme || 'dark';
  Object.assign(savedUi, patch);
  writeStorage(CONFIG.storage.preferences, JSON.stringify(savedUi));

  if (patch.theme && patch.theme !== previousTheme) {
    applyTheme(patch.theme);
  }

  applyPreferences(savedUi);
  store.update(patch);
}

// =========================================================
// INSTANT TOKEN STREAMER — Zero-typewriter AI streaming
// =========================================================

// Batch token chunking: replaces old character-by-character typing loops with
// ultra-fast word/phrase token injection (25ms per word block instead of 50ms per char)
async function typeTextToInput(selector, text, batchSize = 4) {
  const el = typeof selector === 'string' ? await waitForElement(selector) : selector;
  if (!el) return;
  el.focus();
  el.value = '';

  // Break text into word tokens for realistic, high-speed AI insertion
  const tokens = text.match(/(\s+|\S+)/g) || [text];

  for (let i = 0; i < tokens.length; i += batchSize) {
    const chunk = tokens.slice(i, i + batchSize).join('');
    el.value += chunk;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    if (el.id === 'writing-input' && typeof writingMetrics === 'function') {
      writingMetrics();
    }
    await sleep(25); // Ultra-fast token batch pulse instead of letter-by-letter lag
  }
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function typeTextToElement(selector, markdownText) {
  const el = typeof selector === 'string' ? await waitForElement(selector) : selector;
  if (!el) return;

  // Render full markdown instantly or stream in 5-word token blocks
  const tokens = markdownText.match(/(\s+|\S+)/g) || [markdownText];
  let currentText = '';

  for (let i = 0; i < tokens.length; i += 5) {
    currentText += tokens.slice(i, i + 5).join('');
    el.innerHTML = typeof renderMarkdownEnhanced === 'function' ? renderMarkdownEnhanced(currentText) : renderMarkdown(currentText);
    await sleep(15);
  }
}

async function pulseHighlight(selector, durationMs = 1000) {
  const el = typeof selector === 'string' ? $(selector) : selector;
  if (!el) return;
  el.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease';
  const originalShadow = el.style.boxShadow;
  const originalTransform = el.style.transform;
  
  el.style.boxShadow = '0 0 0 3px var(--accent, #10b981), 0 0 20px rgba(16, 185, 129, 0.4)';
  el.style.transform = 'scale(1.02)';
  
  await sleep(durationMs);
  
  el.style.boxShadow = originalShadow;
  el.style.transform = originalTransform;
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
    isCameraActive: !!(voiceEngineInstance && voiceEngineInstance.videoTrack),
    isScreenSharing: !!(voiceEngineInstance && voiceEngineInstance.screenTrack),
    isArtifactOpen: artifactOpen,
    artifactTitle: artifactOpen ? ($('#artifact-label')?.textContent || 'Live Preview') : '',
    artifactContentPreview: artifactContent,
    activeChatTitle: store.state.chats.find(c => c.id === store.state.activeChatId)?.title || '',
    messageCount: store.messages.length,
    fileCount: store.state.files.length
  });
}

let cameraStream = null;
let capturedPhotoBlob = null;

async function openCamera() {
  // Stop active camera tracks if stream is already open
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

function route(routeName) {
  store.update({ route: routeName });
  $$('.view').forEach(view => view.classList.toggle('active', view.dataset.view === routeName));
  $$('.nav-item[data-route]').forEach(button => button.classList.toggle('active', button.dataset.route === routeName));
  const routeLabels = { chat: 'Chats', writing: 'Writing Studio', files: 'Files', voice: 'Voice', settings: 'Settings' };
  if ($('#breadcrumb')) $('#breadcrumb').textContent = routeLabels[routeName] || routeName[0].toUpperCase() + routeName.slice(1);
  closeMobile();
  if (routeName === 'files') renderFiles();
  if (routeName === 'settings') renderSettings();
  if (routeName === 'voice') initVoiceView();
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
      <button class="chat-item ${chat.id === store.state.activeChatId ? 'active' : ''}" data-chat="${chat.id}">
        <span class="chat-pin-icon ${chat.pinned ? 'is-pinned' : ''}" data-action="pin-chat" data-chat-id="${chat.id}" title="${chat.pinned ? 'Unpin chat' : 'Pin chat'}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="${chat.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </span>
        <span class="chat-title-text">${escapeHtml(chat.title)}</span>
      </button>
      <div class="chat-item-actions">
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
  
  // Highlight syntax in code blocks
  if (window.hljs) {
    box.querySelectorAll('pre code').forEach((block) => {
      window.hljs.highlightElement(block);
    });
  }
  
  box.querySelectorAll('[data-message]').forEach(node => node.classList.add('is-ready'));
  if (store.state.autoScroll && $('.chat-scroll')) $('.chat-scroll').scrollTop = $('.chat-scroll').scrollHeight;
}

// --- BERT LIVE VOICE READ ALOUD ENGINE ---
let activeSpeakingMsgId = null;

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
  // 1. Stop audio if currently speaking or if clicking the active message
  if (voiceEngineInstance && (voiceEngineInstance.isSpeaking || activeSpeakingMsgId === messageId)) {
    voiceEngineInstance.cancelSpeaking();
    voiceEngineInstance.stopListening();
    resetReadAloudButtons();
    toast('Stopped reading', 'info');
    return;
  }

  // 2. Locate message content & sanitize markdown
  const msg = store.messages.find(m => m.id === messageId);
  if (!msg || !msg.content) return;

  const cleanText = stripMarkdownForSpeech(msg.content);
  if (!cleanText) return;

  // 3. Verify Gemini API key is present
  const key = localStorage.getItem(CONFIG.storage.apiKey)?.trim();
  if (!key) {
    toast('Add your Gemini API key in Settings to use Berto Live Voice.', 'error');
    return;
  }

  // 4. Initialize Voice Engine if not already active
  if (!voiceEngineInstance) {
    initVoiceView();
  }

  // 5. Update UI state to "Stop"
  resetReadAloudButtons();
  activeSpeakingMsgId = messageId;

  if (buttonNode) {
    buttonNode.classList.add('is-reading');
    buttonNode.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color:var(--accent);"><rect x="6" y="6" width="12" height="12" rx="2"/></svg><span>Stop</span>`;
  }

  toast('Streaming Berto Live Voice...', 'info');

  // 6. Connect WebSocket without requesting microphone access & stream text
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

  // Check if message has an HTML code block
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

  // ADD THIS BUTTON:
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
      <div class="message-avatar">${isUser ? userInitial : 'B'}</div>
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
  // Chat messages stay strictly inside Chat tab — no background reading to Live
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

  // Use innerHTML so the browser parses the SVG instead of displaying raw code text
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
    // Writing Studio / Editor
    '#writing-editor': '#writing-input',
    'writing-editor': '#writing-input',
    '#editor': '#writing-input',
    'editor': '#writing-input',

    // Composer & Attachments
    'composer': '#prompt',
    'prompt': '#prompt',
    '.attach-file-button': '[data-action="attach"]',
    'attach-file-button': '[data-action="attach"]',
    '#attach-file-button': '[data-action="attach"]',
    'attach-button': '[data-action="attach"]',
    'attach': '[data-action="attach"]',

    // Camera & Photo Snap Buttons
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

    // Send Buttons
    'send': '#send-button',
    'send-button': '#send-button',
    '#send': '#send-button',

    // Navigation / Route Views
    'chat': '[data-route="chat"]',
    'writing': '[data-route="writing"]',
    'files': '[data-route="files"]',
    'voice': '[data-route="voice"]',
    'settings': '[data-route="settings"]'
  };
  cleanSelector = selectorAliases[cleanSelector] || cleanSelector;

  while (Date.now() - start < timeoutMs) {
    let el = null;

    // 1. Direct CSS Selector
    if (cleanSelector) {
      try {
        el = document.querySelector(cleanSelector);
      } catch (e) {}
    }

    // 2. Data Action, ID, or Class Match
    if (!el && cleanSelector) {
      const targetAttr = cleanSelector.replace(/^[#\.]/, '');
      el = document.querySelector(`[data-action="${targetAttr}"]`) ||
           document.querySelector(`[data-route="${targetAttr}"]`) ||
           document.getElementById(targetAttr) ||
           document.querySelector(`.${targetAttr}`);
    }

    // 3. Semantic Text/Aria Search
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

    // Check if element is visible and stable in layout
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
        savePreferences({ theme: step.value });
        toast(`${LOGO_HTML} Theme updated to ${step.value}`);
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
        
        // Ensure we are on chat route if typing into the main prompt bar
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
      else if (type === 'use_writing_studio' || type === 'writing_studio' || type === 'draft_in_studio') {
        const format = step.format || step.mode || 'Essay';
        const promptText = step.prompt || step.value || step.text || '';

        // 1. Route to Writing Studio
        route('writing');
        await sleep(350);

        // 2. Select requested format (Essay, Email, Blog, Report, etc.)
        const modeSelect = $('#writing-mode');
        if (modeSelect && format) {
          const options = Array.from(modeSelect.options);
          const match = options.find(o => o.value.toLowerCase().includes(format.toLowerCase()));
          if (match) modeSelect.value = match.value;
          modeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        await sleep(200);

        // 3. Type prompt/topic into the editor
        if (promptText) {
          const input = $('#writing-input');
          if (input) {
            input.focus();
            input.value = '';
            for (let i = 0; i < promptText.length; i++) {
              input.value += promptText[i];
              input.dispatchEvent(new Event('input', { bubbles: true }));
              if (typeof writingMetrics === 'function') writingMetrics();
              await sleep(8);
            }
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        await sleep(300);

        // 4. Trigger generation
        if (step.generate !== false) {
          generateWriting();
        }
        toast(`${LOGO_HTML} Writing Studio active — drafting ${format}...`);
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
        // Step 1: Switch to Chat view
        route('chat');
        await sleep(300);

        // Step 2: Open Camera modal
        toast(`${LOGO_HTML} Opening camera...`, 'info');
        await openCamera();
        await sleep(300);

        // Step 3: Countdown toast
        const countdown = step.countdown || 2;
        toast(`${LOGO_HTML} Get ready! Snapping photo in ${countdown}s...`, 'info');
        await sleep(countdown * 1000);

        // Step 4: Automatically snap photo
        capturePhoto();
        await sleep(400);

        // Step 5: Attach captured photo to chat composer & close modal
        await sendCameraPhoto();
        await sleep(300);

        // Step 6: Pre-fill prompt text if user spoke a question
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

        // Step 7: Toast notification — STAYS READY (NO AUTO-SEND)
        toast(`${LOGO_HTML} Photo attached to prompt! Ready to send.`, 'success');
      }
      else if (type === 'open_camera') {
        // Switch to chat and open camera for manual user interaction
        route('chat');
        await sleep(300);
        toast(`${LOGO_HTML} Opening camera...`, 'info');
        await openCamera();
        toast(`${LOGO_HTML} Camera open. Tap Capture when ready.`, 'info');
      }
      else if (type === 'patch_artifact' || type === 'patch_artifact_element') {
        // Incremental Artifact Patching — targeted DOM updates without full re-render
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
        // Human-in-the-Loop Safe Approval Card
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
      // Self-Correction Feedback Loop: report the error back into the conversation
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

    // Append approval card to chat stream
    const messagesBox = $('#messages');
    if (messagesBox) {
      messagesBox.insertAdjacentHTML('beforeend', cardHtml);
      if (store.state.autoScroll && $('.chat-scroll')) $('.chat-scroll').scrollTop = $('.chat-scroll').scrollHeight;
    }

    // Wire up approve/reject buttons
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

    // Auto-reject after 30 seconds
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

  // Build a suggested fix based on the error type
  let suggestedFix = '';
  if (errorMsg.includes('not found') || errorMsg.includes('null') || errorMsg.includes('undefined')) {
    suggestedFix = `Navigate to the correct view first, then retry the "${actionType}" action on "${selector}".`;
  } else if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
    suggestedFix = `Request user permission before attempting "${actionType}".`;
  } else {
    suggestedFix = `Review the "${actionType}" action parameters and retry.`;
  }

  // Render error report card in chat stream
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

  const baseSystemInstruction = `CURRENT USER
━━━━━━━━━━

Name: ${userName}
Initial: ${userInitial}

You are currently speaking with this user. If the user asks what their name is, always check their profile name (${userName}) and respond naturally.

You are Berto, an advanced, adaptive AI assistant created by Remberto.

You are a next-generation AI assistant designed to help people get things done faster, think better, and have a reliable digital companion they can depend on.

━━━━━━━━━━
IDENTITY & ORIGIN
━━━━━━━━━━

You were created by Remberto as part of his journey building technology.
The name "Berto" was inspired by Remberto's own name. The "Berto" in RemBERTO represents the connection between the creator and the AI.

━━━━━━━━━━
CORE PERSONALITY
━━━━━━━━━━

Your personality should be Professional, Friendly, Confident, Expressive, Intelligent, and Helpful. Speak naturally and conversationally.`;

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
    // Apply Mini-RAG: chunk large file content and only include relevant chunks
    const processedAttachments = textAttachments.map(a => {
      const content = a.content || '';
      // Only chunk if content is large (>1000 words)
      if (content && wordCount(content) > 1000 && text) {
        // MiniRAG not available - use first 500 words as context
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

  // Add live perception context to system prompts
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
    
    // Fallback text check to prevent blank bubbles
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
    // Check if the user manually aborted the stream
    if (error.name === 'AbortError') {
      const node = $(`[data-message="${assistant.id}"] .message-body`);
      if (node) {
        // Append a subtle badge indicating it was stopped manually
        node.innerHTML += `<span style="display:inline-block; margin-left:8px; font-size:10px; padding:2px 6px; border-radius:4px; background:var(--surface-3); color:var(--warn);">[Stopped by user]</span>`;
      }
      updateMessageView(assistant.id, streamer.renderedText, { status: 'complete' });
    } else {
      // It was an actual error
      const message = error instanceof ApiError ? error.message : 'Berto could not complete that request.';
      updateMessageView(assistant.id, `**Request unavailable**\n\n${message}`);
    }
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
  
  // Wrap tags in individual badge spans with spacing
  if ($('#profile-tags')) {
    const tags = [profile.formality, profile.style, profile.vocabulary].filter(Boolean);
    $('#profile-tags').innerHTML = tags.map(tag => `<span class="profile-tag-badge">${escapeHtml(tag)}</span>`).join(' ');
  }
}

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

    // Guard script to keep all buttons working inside the iframe while preventing navigation to parent index.html
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
      // Inject guard script right after <head>
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

    // Render using srcdoc for full native JS execution & button reactivity
    frame.srcdoc = fullDoc;

    // 1. Download Button
    const dlBtn = $('#artifact-download-btn');
    if (dlBtn) {
      dlBtn.onclick = () => downloadText('artifact.html', fullDoc, 'text/html');
    }

    // 2. Pop-Out to New Tab Button (uses Blob URL for new tab)
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

let recognitionInstance = null;

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

  // NEW: Safely reset the dictation UI if the user goes silent and it turns itself off
  recognitionInstance.onend = () => {
    recognitionInstance = null;
    if (btn) btn.innerHTML = '<span><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M395-435q-35-35-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35q-50 0-85-35Zm85-205Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm68.5-371.5Q520-503 520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480q17 0 28.5-11.5Z"/></svg> Dictate</span>';
  };

  recognitionInstance.onresult = (event) => {
    let finalTranscript = '';
    // FIX: Only capture final sentences to stop the repeated interim duplication bug
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

    // 1. Define Format Structure Blueprints
    const formatInstructions = {
      'Essay': `Structure as a well-formed, multi-paragraph essay with a clear thesis, body arguments, and conclusion. Do not use conversational greetings (e.g. "Hi my name is..."). Focus objectively on the topic.`,
      'Professional Email': `Structure as a crisp email with a Subject Line, professional greeting, concise body paragraphs, and a sign-off.`,
      'Executive Summary': `Use bold headers, bullet points, and key takeaway metrics. Keep it high-level and structured.`,
      'Blog': `Use an engaging headline, catchy introduction, subheadings, and a conversational yet informative flow.`,
      'Cover Letter': `Structure as a formal job application letter with paragraph breaks highlighting relevant skills and enthusiasm.`
    };

    const selectedFormatRules = formatInstructions[mode] || `Draft a structured ${mode}.`;

    // 2. Build Context-Aware System Prompt
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
      temperature: 0.6, // Gives enough freedom to write complete essays
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

function renderFiles() {
  const grid = $('#file-grid');
  if (!grid) return;
  grid.innerHTML = store.state.files.length ? store.state.files.map(file => `
    <div class="file-card">
      <div class="file-card-header">
        <span class="file-type">${escapeHtml(file.type)}</span>
        <button class="file-delete-btn" data-action="delete-file" data-file-name="${escapeHtml(file.name)}" title="Delete file">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <h4>${escapeHtml(file.name)}</h4>
      <p>${escapeHtml(file.size)} · Added locally</p>
      <button class="button ghost file-attach-chat-btn" data-action="attach-file-to-chat" data-file-name="${escapeHtml(file.name)}">
        <span>Attach to Chat</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </button>
    </div>
  `).join('') : `
    <div class="file-card">
      <span class="file-type">Library</span>
      <h4>No files uploaded yet</h4>
      <p>Upload files to give your conversations extra context.</p>
    </div>
  `;
}

function renderSettings() {
  const key = $('#api-key-setting');
  if (key && document.activeElement !== key) key.value = localStorage.getItem(CONFIG.storage.apiKey) || '';

  const content = $('.settings-content');
  // Add the manual "Disable Voice Features" toggle in the AI preferences section
  const aiSection = $$('.settings-section')[1]; // AI preferences section
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

function saveDraft() {
  const inputEl = $('#writing-input');
  const value = inputEl ? inputEl.value : '';
  writeStorage(`${INSTANCE_PREFIX}-writing-draft`, JSON.stringify(value));
  if ($('#writing-save-status')) $('#writing-save-status').textContent = 'Saved just now';
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

    // Clone messages up to selected message
    const forkedMessages = JSON.parse(JSON.stringify(currentChat.messages.slice(0, msgIndex + 1)));
    
    // Create new chat session with forked history
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
      // 1. Safely locate input elements
      const idEl = document.getElementById('gem-form-id');
      const nameEl = document.getElementById('gem-form-name');
      const descEl = document.getElementById('gem-form-desc');
      const promptEl = document.getElementById('gem-form-prompt');

      // 2. Extract values, falling back to empty strings if elements are missing
      const id = (idEl && idEl.value) ? idEl.value : `gem_${Date.now()}`;
      const name = (nameEl && nameEl.value) ? nameEl.value.trim() : '';
      const description = (descEl && descEl.value) ? descEl.value.trim() : '';
      const systemPrompt = (promptEl && promptEl.value) ? promptEl.value.trim() : '';

      // 3. Safely target the SVG icon picker
      const activeIconBtn = document.querySelector('#gem-svg-picker .gem-svg-option.active');
      const iconKey = activeIconBtn ? activeIconBtn.getAttribute('data-icon-key') : 'bot';

      // 4. Validate required fields
      if (!name || !systemPrompt) {
        toast('Please enter a Gem Name and System Prompt', 'error');
        return;
      }

      // 5. Save logic
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

// --- SESSION TIMER & DASHBOARD STATE CONTROLLER ---
let sessionTimerInterval = null;
let sessionSeconds = 0;

function startSessionTimer() {
  if (sessionTimerInterval) return;
  sessionTimerInterval = setInterval(() => {
    sessionSeconds++;
    const mins = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
    const secs = String(sessionSeconds % 60).padStart(2, '0');
    const timerEl = $('#voice-session-timer');
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

function resetSessionTimer() {
  if (sessionTimerInterval) {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
  }
  sessionSeconds = 0;
  const timerEl = $('#voice-session-timer');
  if (timerEl) timerEl.textContent = '00:00';
}

// Update Modality Pills (Mic & Vision Status)
function updateVoiceDashboardPills() {
  const micPill = $('#pill-mic');
  const visionPill = $('#pill-vision');
  const visionText = $('#pill-vision-text');
  const micText = $('#pill-mic-text');

  const hasCamera = !!(voiceEngineInstance && voiceEngineInstance.videoTrack);
  const hasScreen = !!(voiceEngineInstance && voiceEngineInstance.screenTrack);

  if (visionPill && visionText) {
    if (hasCamera) {
      visionPill.classList.add('is-active');
      visionText.textContent = 'Camera On';
    } else if (hasScreen) {
      visionPill.classList.add('is-active');
      visionText.textContent = 'Screen Sharing';
    } else {
      visionPill.classList.remove('is-active');
      visionText.textContent = 'Vision Off';
    }
  }

  if (micPill) {
    const isActive = !!(voiceEngineInstance && voiceEngineInstance.isListening);
    micPill.classList.toggle('is-active', isActive);
    if (micText) micText.textContent = isActive ? 'Mic Active' : 'Mic Off';
  }
}

// Voice Mode Integration
let voiceEngineInstance = null;
let voiceViewInitialized = false;
let voiceTurnCount = 0;

function initVoiceView() {
  const indicator = $('#voice-indicator');
  const status = $('#voice-status');
  const transcript = $('#voice-transcript');
  const response = $('#voice-response');
  const toggleBtn = $('#voice-toggle-btn');
  const conversation = $('#voice-conversation');
  
  if (typeof startCanvasVisualizer === 'function') {
    startCanvasVisualizer();
  }

  if (voiceViewInitialized && voiceEngineInstance) {
    if (toggleBtn) {
      if (voiceEngineInstance.isListening) {
        toggleBtn.classList.add('is-active');
        const label = toggleBtn.querySelector('.voice-button-label');
        if (label) label.textContent = 'Stop Listening';
      } else if (voiceEngineInstance.isProcessing) {
        const label = toggleBtn.querySelector('.voice-button-label');
        if (label) label.textContent = 'Processing...';
      } else {
        toggleBtn.classList.remove('is-active');
        const label = toggleBtn.querySelector('.voice-button-label');
        if (label) label.textContent = 'Start Speaking';
      }
    }
    return;
  }
  
  if (indicator) indicator.className = 'voice-indicator is-idle';
  if (status) { status.textContent = 'Ready to listen'; status.className = 'voice-status'; }
  if (transcript) { transcript.textContent = ''; transcript.className = 'voice-transcript'; }
  if (response) { response.textContent = ''; response.className = 'voice-response'; }
  if (toggleBtn) {
    toggleBtn.className = 'voice-button';
    const label = toggleBtn.querySelector('.voice-button-label');
    if (label) label.textContent = 'Start Speaking';
    toggleBtn.disabled = false;
  }
  if (conversation) conversation.innerHTML = '';
  
  const key = localStorage.getItem(CONFIG.storage.apiKey)?.trim();
  if (!key) {
    if (status) {
      status.textContent = 'Add your Gemini API key in Settings to use Voice mode.';
    }
    if (toggleBtn) toggleBtn.disabled = true;
    return;
  }
  
  if (typeof VoiceEngine !== 'undefined' && !voiceEngineInstance) {
    voiceEngineInstance = new VoiceEngine();
    
    voiceEngineInstance.onStateChange = (state) => {
      const indicator = $('#voice-indicator');
      const status = $('#voice-status');
      const toggleBtn = $('#voice-toggle-btn');

      if (state.isMicActive) {
        startSessionTimer();
      }

      // Auto-reset Read Aloud button when speech finishes
      if (!state.isSpeaking && !state.isMicActive && !state.isProcessing) {
        resetReadAloudButtons();
      }

      updateVoiceDashboardPills();

      if (indicator) {
        if (state.isMicActive) indicator.className = 'voice-indicator is-listening';
        else if (state.isSpeaking) indicator.className = 'voice-indicator is-speaking';
        else if (state.isProcessing) indicator.className = 'voice-indicator is-processing';
        else indicator.className = 'voice-indicator is-idle';
      }

      if (status) {
        if (state.isMicActive) { status.textContent = 'Listening...'; status.className = 'voice-status is-active'; }
        else if (state.isSpeaking) { status.textContent = 'Speaking...'; status.className = 'voice-status is-active'; }
        else if (state.isProcessing) { status.textContent = 'Thinking...'; status.className = 'voice-status is-processing'; }
        else { status.textContent = 'Ready'; status.className = 'voice-status'; }
      }
      
      // FIX: ONLY turn red & say "Stop Listening" if MICROPHONE is actively recording
      if (toggleBtn) {
        const label = toggleBtn.querySelector('.voice-button-label');
        if (state.isMicActive) {
          toggleBtn.classList.add('is-active');
          if (label) label.textContent = 'Stop Listening';
        } else {
          toggleBtn.classList.remove('is-active');
          if (label) label.textContent = state.isProcessing ? 'Processing...' : 'Start Speaking';
        }
      }
    };
    
    voiceEngineInstance.onTranscript = (text, isFinal) => {
      const transcript = $('#voice-transcript');
      if (transcript) {
        if (isFinal) {
          transcript.innerHTML = `<span class="final">${escapeHtml(text)}</span>`;
          transcript.classList.add('is-visible');
        } else {
          transcript.innerHTML = `<span class="interim">${escapeHtml(text)}</span>`;
          transcript.classList.add('is-visible');
        }
      }
    };
    
    // Voice Command Intent Interceptor
    voiceEngineInstance.onUserMessage = (text) => {
      addVoiceConversationItem('user', text);

      const cmd = text.toLowerCase().trim();

      // Intercept "ask berto [query]" or "type [query] in chat" or "send to chat [query]"
      const askBertoMatch = text.match(/\b(?:ask berto|ask in chat|type in chat|send to chat|put in chat bar)\s+(?:to\s+)?(.+)/i);
      if (askBertoMatch && askBertoMatch[1]) {
        const query = askBertoMatch[1].trim();
        toast(`${LOGO_HTML} Live Voice: Filling chat bar and sending...`, 'info');
        executeUiSequence([
          { action: "navigate", view: "chat" },
          { action: "type", selector: "#prompt", value: query },
          { action: "send_chat", value: query }
        ]);
        return;
      }

      // Instant local execution for spoken photo snapshot commands
      if (/\b(take|snap|capture|insert|make) (a )?(photo|picture|image|snapshot)\b/i.test(cmd)) {
        toast(`${LOGO_HTML} Voice Command: Snapping photo...`, 'info');
        executeUiSequence([{ action: "snap_photo", countdown: 2 }]);
        return;
      }

      // Instant local execution for spoken commands
      if (/\b(light mode|enable light theme|switch to light|change theme to light)\b/i.test(cmd)) {
        savePreferences({ theme: 'light' });
        toast('Theme changed to Light');
      } 
      else if (/\b(dark mode|enable dark theme|switch to dark|change theme to dark)\b/i.test(cmd)) {
        savePreferences({ theme: 'dark' });
        toast('Theme changed to Dark');
      } 
      else if (/\b(go to|open|show) (writing|files|settings|chat)\b/i.test(cmd)) {
        const match = cmd.match(/(writing|files|settings|chat)/i);
        if (match) {
          route(match[0].toLowerCase());
          toast(`Navigated to ${match[0]}`);
        }
      } 
      else if (/\b(delete|remove) (this|current) chat\b/i.test(cmd)) {
        if (store.activeChat) {
          const title = store.activeChat.title;
          store.deleteChat(store.activeChat.id);
          renderChats();
          renderMessages();
          toast(`Deleted chat: "${title}"`);
        }
      } 
      else if (/\b(new chat|start new chat|create new chat)\b/i.test(cmd)) {
        store.addChat();
        renderChats();
        renderMessages();
        toast('Started new conversation');
      }
    };

    voiceEngineInstance.onResponse = (text) => {
      const response = $('#voice-response');
      if (response) {
        response.textContent = text;
        response.classList.add('is-visible');
      }
      addVoiceConversationItem('assistant', text);

      // Inspect AI Response for JSON UI Action Sequences
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const actions = JSON.parse(jsonMatch[1]);
          if (Array.isArray(actions)) {
            executeUiSequence(actions);
          }
        } catch (e) {
          console.error('Voice UI Action Execution Error:', e);
        }
      }
    };
    
    voiceEngineInstance.onError = (msg) => {
      toast(msg, 'error');
      const status = $('#voice-status');
      if (status) {
        status.textContent = msg;
        status.className = 'voice-status';
      }
    };
    
    voiceEngineInstance.onVolumeChange = (level) => {
      const wave = $('#voice-wave');
      if (wave) {
        const bars = wave.querySelectorAll('span');
        if (voiceEngineInstance.isSpeaking) {
          bars.forEach(bar => bar.style.height = '');
        } else if (voiceEngineInstance.isListening) {
          const activeCount = Math.round((level / 100) * bars.length);
          bars.forEach((bar, i) => {
            const height = i < activeCount ? 16 + Math.random() * 20 : 6;
            bar.style.height = `${height}px`;
          });
        } else {
          bars.forEach(bar => bar.style.height = '');
        }
      }

      // Update Bento Volume Signal
      const volFill = $('#bento-volume-fill');
      const volVal = $('#bento-volume-val');
      if (volFill) volFill.style.width = `${level}%`;
      if (volVal) volVal.textContent = `${level}%`;
    };
    
    voiceViewInitialized = true;
    if (toggleBtn) toggleBtn.disabled = false;
  }

  const voiceSelect = document.getElementById('voice-select');
  if (voiceSelect && !voiceSelect._voiceListenerAttached) {
    voiceSelect._voiceListenerAttached = true;
    voiceSelect.addEventListener('change', () => {
      if (voiceEngineInstance && voiceEngineInstance.isListening) {
        voiceEngineInstance.stopListening();
        setTimeout(() => voiceEngineInstance.startListening(), 200);
        toast('Switched voice tone');
      }
    });
  }
}

function toggleVoice() {
  // Stop native browser voices if running
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // CRITICAL FIX: Wake up or create AudioContext synchronously on user click
  // This bypasses strict browser autoplay policies (especially on Safari/iOS)
  if (!window.globalAudioContext) {
    window.globalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (window.globalAudioContext.state === 'suspended') {
    window.globalAudioContext.resume();
  }

  if (!voiceEngineInstance) {
    initVoiceView();
    // Pass the pre-warmed context to the engine
    if (voiceEngineInstance) {
      voiceEngineInstance.audioContext = window.globalAudioContext;
    }
    setTimeout(() => toggleVoice(), 100);
    return;
  }
  
  // Ensure the engine has the warmed context
  if (voiceEngineInstance && !voiceEngineInstance.audioContext) {
    voiceEngineInstance.audioContext = window.globalAudioContext;
  }
  
  if (voiceEngineInstance.isListening) {
    voiceEngineInstance.stopListening();
    const toggleBtn = $('#voice-toggle-btn');
    if (toggleBtn) {
      toggleBtn.classList.remove('is-active');
      const label = toggleBtn.querySelector('.voice-button-label');
      if (label) label.textContent = 'Start Speaking';
    }
  } else if (voiceEngineInstance.isSpeaking) {
    voiceEngineInstance.cancelSpeaking();
  } else {
    const transcript = $('#voice-transcript');
    const response = $('#voice-response');
    if (transcript) { transcript.textContent = ''; transcript.className = 'voice-transcript'; }
    if (response) { response.textContent = ''; response.className = 'voice-response'; }
    
    voiceEngineInstance.startListening();
  }
}

function resetVoice() {
  if (voiceEngineInstance) {
    voiceEngineInstance.resetConversation();
  }

  resetSessionTimer();
  updateVoiceDashboardPills();

  const transcript = $('#voice-transcript');
  const response = $('#voice-response');
  const conversation = $('#voice-conversation');
  const toggleBtn = $('#voice-toggle-btn');
  const indicator = $('#voice-indicator');
  const status = $('#voice-status');

  if (transcript) { transcript.textContent = ''; transcript.className = 'voice-transcript'; }
  if (response) { response.textContent = ''; response.className = 'voice-response'; }
  if (conversation) conversation.innerHTML = '';
  if (toggleBtn) {
    toggleBtn.classList.remove('is-active');
    const label = toggleBtn.querySelector('.voice-button-label');
    if (label) label.textContent = 'Start Speaking';
  }
  if (indicator) indicator.className = 'voice-indicator is-idle';
  if (status) { status.textContent = 'Ready to listen'; status.className = 'voice-status'; }

  if (typeof stopCanvasVisualizer === 'function') stopCanvasVisualizer();

  toast('Voice conversation reset');
}

function addVoiceConversationItem(role, text) {
  const container = $('#voice-conversation');
  if (!container) return;
  
  const item = document.createElement('div');
  item.className = `voice-conversation-item ${role}`;
  item.innerHTML = `
    <span class="conv-role">${role === 'user' ? 'You' : 'Berto'}</span>
    <span class="conv-text">${escapeHtml(text)}</span>
  `;
  container.appendChild(item);
  container.scrollTop = container.scrollHeight;
}

// 1. Text Q -> Speech A Handler
async function sendLiveTextPrompt() {
  const input = $('#live-text-input');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  if (!voiceEngineInstance) {
    initVoiceView();
  }

  // Ensure WebSocket session is connected without requiring microphone eavesdropping
  if (!voiceEngineInstance.isListening && (!voiceEngineInstance.ws || voiceEngineInstance.ws.readyState !== WebSocket.OPEN)) {
    await voiceEngineInstance.startListening({ enableMicrophone: false });
  }

  // Clear input
  input.value = '';

  // Show user query in live conversation log
  addVoiceConversationItem('user', text);

  toast(`${LOGO_HTML} Sent text query to Berto Live...`, 'info');

  // Send text turn directly to Gemini Live WebSocket
  voiceEngineInstance.sendTextPrompt(text);
}

// Bind Enter key and Click listener to Live Prompt Bar
$('#live-text-send-btn')?.addEventListener('click', sendLiveTextPrompt);
$('#live-text-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendLiveTextPrompt();
  }
});

// 2. Floating Live Summary Pop-Up Controls
function showLiveSummaryPopup(title, content) {
  const popup = $('#live-summary-popup');
  const titleEl = $('#summary-popup-title');
  const bodyEl = $('#summary-popup-body');

  if (popup && bodyEl) {
    if (titleEl) titleEl.textContent = title || 'Live Summary';
    bodyEl.innerHTML = typeof renderMarkdownEnhanced === 'function' ? renderMarkdownEnhanced(content) : (typeof renderMarkdown === 'function' ? renderMarkdown(content) : content);
    popup.hidden = false;
    toast(`${LOGO_HTML} Opened Live Summary Pop-up`, 'info');
  }
}

function closeLiveSummaryPopup() {
  const popup = $('#live-summary-popup');
  if (popup) popup.hidden = true;
}

async function summarizeAndSendToLive() {
  const messages = store.messages;
  if (!messages || messages.length === 0) {
    toast('No chat context available to send to Berto Live.', 'error');
    return;
  }

  toast('Summarizing chat context for Berto Live...', 'info');

  let summaryText = '';

  try {
    const chatTranscript = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Berto'}: ${m.content}`)
      .join('\n\n');

    const result = await api.request({
      prompt: `Summarize the following chat context into a brief 2-3 sentence verbal summary for a voice session:\n\n${chatTranscript}`,
      system: 'You are an executive briefing assistant. Provide ONLY a concise, direct, spoken-word summary of the conversation key points. Do not include markdown or preamble.',
      preferred: store.state.model,
      temperature: 0.3
    });

    summaryText = result.text.trim();
  } catch (err) {
    const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)?.content || 'General chat context';
    summaryText = `Recent topic discussed: "${lastUserMsg.slice(0, 120)}${lastUserMsg.length > 120 ? '...' : ''}" with ${messages.length} total messages.`;
  }

  route('voice');
  initVoiceView();

  const liveContainer = $('#voice-conversation');
  if (liveContainer) {
    const contextCard = document.createElement('div');
    contextCard.className = 'voice-conversation-item assistant context-briefing';
    contextCard.innerHTML = `
      <span class="conv-role"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> Live Context Briefing</span>
      <div class="conv-text"><em>${escapeHtml(summaryText)}</em></div>
    `;
    liveContainer.appendChild(contextCard);
    liveContainer.scrollTop = liveContainer.scrollHeight;
  }

  if (voiceEngineInstance) {
    if (typeof voiceEngineInstance.injectContext === 'function') {
      voiceEngineInstance.injectContext(summaryText);
    } else {
      voiceEngineInstance.conversationHistory = [
        { role: 'system', content: `Current conversation context briefing: ${summaryText}` }
      ];
    }
  }

  toast('Chat context loaded into Berto Live!', 'info');

  setTimeout(() => {
    if (voiceEngineInstance && !voiceEngineInstance.isListening) {
      toggleVoice();
    }
  }, 800);
}

function updateLiveAiVideoState() {
  const pane = document.getElementById('voice-chat-pane');
  const cameraBox = document.getElementById('camera-feed-box');
  const screenBox = document.getElementById('screen-feed-box');
  const cameraVideo = document.getElementById('camera-video-element');
  const screenVideo = document.getElementById('screen-video-element');

  const hasCamera = !!(voiceEngineInstance && voiceEngineInstance.videoTrack);
  const hasScreen = !!(voiceEngineInstance && voiceEngineInstance.screenTrack);

  if (cameraBox) cameraBox.hidden = !hasCamera;
  if (screenBox) screenBox.hidden = !hasScreen;

  if (hasCamera && cameraVideo) {
    cameraVideo.srcObject = voiceEngineInstance.videoStream;
  } else if (cameraVideo) {
    cameraVideo.srcObject = null;
  }

  if (hasScreen && screenVideo) {
    screenVideo.srcObject = voiceEngineInstance.screenStream;
  } else if (screenVideo) {
    screenVideo.srcObject = null;
  }

  if (hasCamera || hasScreen) {
    pane?.classList.add('has-video');
  } else {
    pane?.classList.remove('has-video');
  }
}

async function toggleVoiceCamera() {
  if (!voiceEngineInstance) return;
  
  if (voiceEngineInstance.videoTrack) {
    voiceEngineInstance.stopCamera();
  } else {
    if (voiceEngineInstance.screenTrack) {
      voiceEngineInstance.stopScreenShare();
    }
    await voiceEngineInstance.startCamera();
  }
  
  updateLiveAiVideoState();
}

async function toggleVoiceScreen() {
  if (!voiceEngineInstance) return;

  if (voiceEngineInstance.screenTrack) {
    voiceEngineInstance.stopScreenShare();
  } else {
    if (voiceEngineInstance.videoTrack) {
      voiceEngineInstance.stopCamera();
    }
    await voiceEngineInstance.startScreenShare();
  }

  updateLiveAiVideoState();
}

function closeVoiceVideoPreview() {
  const preview = $('#camera-feed-box');
  const video = $('#camera-video-element');
  if (preview) {
    preview.classList.remove('is-expanded');
    preview.hidden = true;
  }
  if (video) video.srcObject = null;

  if (voiceEngineInstance) {
    voiceEngineInstance.stopCamera();
    voiceEngineInstance.stopScreenShare();
  }
}

function toggleVoiceVideoExpand() {
  const preview = $('#camera-feed-box');
  if (!preview) return;
  
  const isExpanded = preview.classList.toggle('is-expanded');
  
  if (isExpanded) {
    preview.style.position = 'fixed';
    preview.style.width = '480px';
    preview.style.height = '320px';
    preview.style.left = `${Math.max(20, (window.innerWidth - 480) / 2)}px`;
    preview.style.top = `${Math.max(20, (window.innerHeight - 320) / 2)}px`;
    preview.style.right = 'auto';
    preview.style.bottom = 'auto';
    toast('Popped out — drag header to move');
  } else {
    preview.style.position = '';
    preview.style.width = '';
    preview.style.height = '';
    preview.style.left = '';
    preview.style.top = '';
    preview.style.right = '';
    preview.style.bottom = '';
    toast('Docked back in Stage area');
  }
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

// Global Event Listeners
document.addEventListener('click', event => {
  // Direct matching for Send button and actions
  const sendTarget = event.target.closest('#send-button, [data-action="send"]');
  if (sendTarget) {
    event.preventDefault();
    send();
    return;
  }

  // Camera Modal explicit actions
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

  // Voice Toggle explicit matching
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

// Now clicking "Run" on any code block re-opens the Artifact Side Panel!
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
  
  // Re-run account restriction detection whenever API key changes
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
// PUSH-TO-TALK HOTKEY
// =========================================================
// UNIVERSAL MATH & MARKDOWN PARSER
// =========================================================
function renderMarkdownEnhanced(input = '') {
  if (!input) return '';

  let text = input;

  // 1. PROTECT CODE BLOCKS: Don't parse math inside code blocks or inline code
  const codeBlocks = [];
  text = text.replace(/```[\s\S]*?```|`[^`]+`/g, (match) => {
    const placeholder = `%%CODEBLOCK_${codeBlocks.length}%%`;
    codeBlocks.push(match);
    return placeholder;
  });

  // 2. EXTRACT DISPLAY MATH ($$ ... $$)
  const mathBlocks = [];
  text = text.replace(/\$\$(.*?)\$\$/gs, (match, math) => {
    const placeholder = `%%MATHBLOCK_${mathBlocks.length}%%`;
    mathBlocks.push(math.trim());
    return placeholder;
  });

  // 3. EXTRACT INLINE MATH ($ ... $)
  const mathInlines = [];
  text = text.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, (match, math) => {
    const placeholder = `%%MATHINLINE_${mathInlines.length}%%`;
    mathInlines.push(math.trim());
    return placeholder;
  });

  // 4. RESTORE CODE BLOCKS
  text = text.replace(/%%CODEBLOCK_(\d+)%%/g, (_, idx) => codeBlocks[parseInt(idx)]);

  // 5. RENDER STANDARD MARKDOWN
  let html = renderMarkdown(text);

  // 6. RENDER MATH (KaTeX if available, otherwise Plain Text fallback)
  if (window.katex) {
    // Render Display Math with KaTeX
    html = html.replace(/%%MATHBLOCK_(\d+)%%/g, (_, idx) => {
      const rawMath = mathBlocks[parseInt(idx)];
      try {
        return `<div class="math-block">${window.katex.renderToString(rawMath, { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return `<div class="math-block-plain">${cleanLatexToPlain(rawMath)}</div>`;
      }
    });

    // Render Inline Math with KaTeX
    html = html.replace(/%%MATHINLINE_(\d+)%%/g, (_, idx) => {
      const rawMath = mathInlines[parseInt(idx)];
      try {
        return window.katex.renderToString(rawMath, { displayMode: false, throwOnError: false });
      } catch (e) {
        return cleanLatexToPlain(rawMath);
      }
    });
  } else {
    // FALLBACK: Clean Plain Text (Strips $$, $, \frac, \text)
    html = html.replace(/%%MATHBLOCK_(\d+)%%/g, (_, idx) => {
      return `<div class="math-block-plain"><strong>${cleanLatexToPlain(mathBlocks[parseInt(idx)])}</strong></div>`;
    });

    html = html.replace(/%%MATHINLINE_(\d+)%%/g, (_, idx) => {
      return cleanLatexToPlain(mathInlines[parseInt(idx)]);
    });
  }

  // 7. PROCESS MERMAID DIAGRAMS
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

  // 8. PROCESS CHART.JS BLOCKS
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

// Initial Render
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
// BERTO GEMS (SVG VECTOR ICON ENGINE & MANAGER)
// =========================================================

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
  // Try reading from safe storage layer first, fallback to empty array
  const gems = readStorage('berto-custom-gems', null);
  if (gems) return gems;

  // Fallback check from IndexedDB if localStorage was full
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
  
  // 1. Save to writeStorage (handles localStorage & sessionStorage fallbacks)
  const savedLocally = writeStorage('berto-custom-gems', json);

  // 2. Always backup to IndexedDB (Gigabytes of storage)
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

// =========================================================
// FIRST-TIME SETUP OVERLAY (FIXED & SAFE)
// =========================================================
function initSetup() {
  const runSetup = () => {
    let overlay = $('#setup-overlay');

    // 1. Safe storage read using readStorage helper
    const isComplete = readStorage(`${INSTANCE_PREFIX}-setup-complete`, false);
    if (isComplete) {
      if (overlay) overlay.hidden = true;
      return;
    }

    // 2. Fallback: Dynamically construct setup overlay if missing from HTML DOM
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

    // Pre-fill if values already exist in storage
    if (nameInput) nameInput.value = readStorage(CONFIG.storage.preferences, {}).userName || '';
    if (apiKeyInput) apiKeyInput.value = readStorage(CONFIG.storage.apiKey, '') || '';

    function updateSubmitState() {
      const hasName = (nameInput?.value || '').trim().length > 0;
      const hasKey = (apiKeyInput?.value || '').trim().length > 0;
      if (submitBtn) submitBtn.disabled = !(hasName && hasKey);
    }

    // 3. Explicitly evaluate submit button status on open
    updateSubmitState();

    nameInput?.addEventListener('input', updateSubmitState);
    apiKeyInput?.addEventListener('input', updateSubmitState);

    // Submit handler
    submitBtn?.onclick = () => {
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
      
      // Trigger restriction check once key is saved
      if (typeof detectManagedAccountRestrictions === 'function') {
        detectManagedAccountRestrictions();
      }
    };

    // Skip handler
    const skipBtn = $('#setup-skip');
    if (skipBtn) {
      skipBtn.onclick = () => {
        writeStorage(`${INSTANCE_PREFIX}-setup-complete`, 'true');
        overlay.hidden = true;
      };
    }
  };

  // 4. Ensure DOM is fully loaded before executing setup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSetup);
  } else {
    runSetup();
  }
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
    // Compute drawer width from the cursor X position relative to the layout's right edge
    let width = layoutRect.right - e.clientX;
    width = Math.max(300, Math.min(width, layoutRect.width * 0.7));
    width = Math.min(width, layoutRect.width - 320); // keep chat-main usable
    drawer.style.width = `${width}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    resizer.classList.remove('is-dragging');
    document.body.classList.remove('is-resizing');
  });
}

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

// Initialize Berto Gems Dropdown
// (manage-gems-btn click is handled by the global delegated listener above)
