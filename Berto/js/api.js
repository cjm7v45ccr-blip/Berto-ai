// Berto ModelRouter, Gemini API & Web Search

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
                         description: "Action: 'snap_photo', 'navigate', 'set_name', 'set_theme', 'type', 'click', 'new_chat', 'send_chat', 'showcase_features', 'save_memory'" 
                       },
                      countdown: { type: "NUMBER", description: "Countdown seconds before snapping photo (default 2)" },
                      autoCapture: { type: "BOOLEAN", description: "Whether to auto-snap after countdown (default true)" },
                      prompt: { type: "STRING", description: "Topic/prompt or question to analyze with snapped photo" },
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

const api = new ModelRouter();

// =========================================================
// DYNAMIC DATE-AUGMENTED REAL-TIME WEB SEARCH
// =========================================================

async function executeWebSearch(query) {
  // 1. Calculate today's exact date dynamically (e.g. "August 6, 2026")
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // 2. Automatically append "as of [Today's Date]" to the query
  let searchTarget = query.trim();
  if (!searchTarget.toLowerCase().includes('as of') && !searchTarget.toLowerCase().includes('202')) {
    searchTarget = `${searchTarget} as of ${todayFormatted}`;
  }

  console.log(`[Berto Search] Original: "${query}" | Date-Augmented: "${searchTarget}"`);
  if (typeof toast === 'function') toast(`Searching live web: "${searchTarget}"...`, 'info');

  try {
    let resultsText = '';

    // 3. Query Google News RSS with the Date-Augmented Query
    try {
      const googleNewsRss = `https://news.google.com/rss/search?q=${encodeURIComponent(searchTarget)}&hl=en-US&gl=US&ceid=US:en`;
      const rssJsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(googleNewsRss)}`;
      
      const newsRes = await fetch(rssJsonUrl);
      const newsData = await newsRes.json();

      if (newsData.status === 'ok' && newsData.items && newsData.items.length > 0) {
        const topNews = newsData.items.slice(0, 4).map((item, idx) => {
          const cleanSnippet = (item.description || '').replace(/<[^>]+>/g, '').trim();
          return `[Live Result ${idx + 1}] ${item.title}\nDate Published: ${item.pubDate}\nSnippet: ${cleanSnippet.slice(0, 250)}...\nSource: ${item.link}`;
        }).join('\n\n');

        resultsText += `=== REAL-TIME RESULTS (CURRENT DATE: ${todayFormatted}) ===\n${topNews}\n\n`;
      }
    } catch (e) {
      console.warn('[Berto Search] News fetch error:', e);
    }

    // 4. Fallback to DuckDuckGo if news yields no results
    if (!resultsText) {
      try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchTarget)}&format=json&no_html=1&no_redirect=1`;
        const ddgRes = await fetch(ddgUrl);
        const ddgData = await ddgRes.json();

        if (ddgData.AbstractText) {
          resultsText += `=== DUCKDUCKGO SUMMARY ===\n${ddgData.Heading}: ${ddgData.AbstractText}\nSource: ${ddgData.AbstractURL}\n\n`;
        }
      } catch (e) {}
    }

    if (!resultsText) {
      resultsText = `No recent status updates found for "${searchTarget}".`;
    }

    return {
      success: true,
      originalQuery: query,
      augmentedQuery: searchTarget,
      searchResults: resultsText
    };
  } catch (err) {
    console.error('[Berto Search Error]:', err);
    return { success: false, error: err.message };
  }
}
