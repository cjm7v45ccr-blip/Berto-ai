// Berto Files Library & PDF/DOCX Text Extraction

// =========================================================
// CLIENT-SIDE SEMANTIC DOCUMENT CHUNKER & SEARCH (FILE:// SAFE)
// =========================================================

class DocumentRAGEngine {
  static chunkDocument(text, chunkSize = 1200, overlap = 200) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }
    return chunks;
  }

  static scoreChunk(query, chunk) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const chunkLower = chunk.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      const matches = (chunkLower.match(new RegExp(term, 'g')) || []).length;
      score += matches * 2;
    }
    return score;
  }

  static getRelevantContext(query, fullText, topN = 3) {
    const chunks = this.chunkDocument(fullText);
    const scored = chunks.map(chunk => ({
      chunk,
      score: this.scoreChunk(query, chunk)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topN).map(item => item.chunk).join('\n\n--- RELEVANT EXCERPT ---\n\n');
  }
}

window.DocumentRAGEngine = DocumentRAGEngine;

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