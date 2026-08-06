// Berto Configuration, Constants & Utilities
window.voiceEngineInstance = null;
const INSTANCE_PREFIX = 'berto';
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

const CHECKLIST_RULE = `
━━━━━━━━━━━━━━━━━━━
CHECKLIST RULE
━━━━━━━━━━━━━━━━━━━
When asked for a checklist or task list, format every task item as a markdown checkbox:
- [ ] Task Title: Short technical description
`;

const BERTO_DOCUMENT_POLICY = `
━━━━━━━━━━━━━━━━━━
DOCUMENT & FILE CITATION POLICY
━━━━━━━━━━━━━━━━━━
When answering questions about attached files or PDFs:
1. Reference exact page numbers whenever available (e.g., "According to Page 4 of [Document Name]...").
2. If analyzing spreadsheets (.xlsx / .csv), present summarized data in Markdown tables or generate Chart.js visualizations.
`;

const CONFIG = Object.freeze({
  maxContextMessages: 80,
  maxMessageChars: 30000,
  autosaveMs: 5000,
  requestTimeoutMs: 120000, // 60s for large files
  streamTimeoutMs: 120000,
  maxRetries: 3,
  maxAttachmentSize: 100 * 1024 * 1024,
  maxContextBytes: 100 * 1024 * 1024,
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
  return String(value).replace(/[&<>"']/g, char => {
    if (char === '&') return '&' + 'amp;';
    if (char === '<') return '&' + 'lt;';
    if (char === '>') return '&' + 'gt;';
    if (char === '"') return '&' + 'quot;';
    return '&#' + '039;';
  });
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
  if (typeof pdfjsLib === 'undefined') {
    throw new Error('PDF.js library is not loaded');
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = `=== PDF DOCUMENT: ${file.name} (${pdf.numPages} Pages) ===\n\n`;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    
    if (pageText.trim()) {
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }
  }

  return fullText;
}

async function extractDocxText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}