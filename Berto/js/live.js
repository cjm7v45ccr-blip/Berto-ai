// Berto AI Workspace - Live Voice Chat Engine (Enhanced UI & Clear Chat)

class BertoLiveEngine {
  constructor() {
    this.LIVE_MODEL          = "models/gemini-2.5-flash-native-audio-preview-12-2025";
    this.CHANNELS            = 1;
    this.SEND_SAMPLE_RATE    = 16000;
    this.RECEIVE_SAMPLE_RATE = 24000;
    this.CHUNK_SIZE          = 1024;

    this.ws = null;
    this.audioCtx = null;
    this.playbackCtx = null;
    this.mediaStream = null;
    this.processor = null;
    this.isConnected = false;
    this.isListening = false;
    this.isSpeaking = false;
    this.nextStartTime = 0;
    this.activeSources = [];
    this.currentAssistantMessage = null;

    this.init();
  }

  init() {
    this.updateUserName();
    this.bindEvents();
  }

  getApiKey() {
    return localStorage.getItem('berto-api-key')?.trim();
  }

  getUserName() {
    try {
      const prefs = JSON.parse(localStorage.getItem('berto-preferences-v2') || '{}');
      return prefs.userName || 'User';
    } catch {
      return 'User';
    }
  }

  updateUserName() {
    const nameEl = document.getElementById('live-welcome-name');
    if (nameEl) nameEl.textContent = this.getUserName();
  }

  getChatContext() {
    if (window.store && window.store.activeChat) {
      return window.store.activeChat.messages || [];
    }
    return [];
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('[data-action="live-toggle"]');
      if (toggleBtn) {
        this.toggleSession();
        return;
      }

      const switchBtn = e.target.closest('[data-action="switch-to-live"]');
      if (switchBtn) {
        this.startFromCurrentChat();
        return;
      }

      const clearBtn = e.target.closest('[data-action="live-clear"]');
      if (clearBtn) {
        this.clearLiveChat();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && document.documentElement.getAttribute('data-route') === 'live') {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          this.toggleSession();
        }
      }
    });
  }

  clearLiveChat() {
    const msgsBox = document.getElementById('live-messages');
    if (msgsBox) msgsBox.innerHTML = '';

    const welcome = document.getElementById('live-welcome');
    if (welcome) welcome.style.display = 'block';

    this.currentAssistantMessage = null;

    if (typeof toast === 'function') {
      toast('Live chat cleared');
    }
  }

  async startFromCurrentChat() {
    if (typeof route === 'function') {
      route('live');
    } else if (window.store) {
      window.store.update({ route: 'live' });
    }

    const promptInput = document.getElementById('prompt');
    const currentTyping = promptInput ? promptInput.value.trim() : '';

    const contextMsgs = this.getChatContext();

    if (currentTyping) {
      contextMsgs.push({ role: 'user', content: currentTyping });
      if (promptInput) promptInput.value = '';
      if (typeof updateCount === 'function') updateCount();
      if (typeof resizePrompt === 'function') resizePrompt();
    }

    const liveMsgsBox = document.getElementById('live-messages');
    
    if (liveMsgsBox && contextMsgs.length > 0) {
      liveMsgsBox.innerHTML = '';
      contextMsgs.forEach(msg => {
        this.appendMessage(msg.role === 'assistant' ? 'assistant' : 'user', msg.content);
      });
      this.hideWelcome();
    }

    if (!this.isConnected) {
      await this.connect();
    }
  }

  async toggleSession() {
    if (this.isConnected) {
      this.disconnect();
    } else {
      await this.connect();
    }
  }

  async connect() {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      if (typeof toast === 'function') {
        toast('Please enter your Gemini API Key in Settings first.', 'error');
      } else {
        alert('Please enter your Gemini API Key in Settings first.');
      }
      return;
    }

    this.updateStatus('Connecting...', 'connecting');

    try {
      this.playbackCtx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.RECEIVE_SAMPLE_RATE
      });

      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(apiKey)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.sendSetupHandshake();
        this.startMicrophone();
      };

      this.ws.onmessage = async (event) => {
        await this.handleIncomingMessage(event);
      };

      this.ws.onerror = (err) => {
        console.error('Berto Live WebSocket Error:', err);
        this.updateStatus('Connection Error', 'error');
        if (typeof toast === 'function') toast('Live Audio connection error.', 'error');
      };

      this.ws.onclose = () => {
        this.disconnect();
      };

    } catch (err) {
      console.error('Failed to start Live session:', err);
      this.disconnect();
      this.updateStatus('Failed to start', 'error');
    }
  }

  sendSetupHandshake() {
    const userName = this.getUserName();
    const userInitial = userName.charAt(0).toUpperCase();
    const chatContext = this.getChatContext();

    // ─── Same Berto identity as text chat — packed concisely ───
    let systemPrompt = `You are Berto, an advanced, adaptive AI assistant created by Remberto.
Your name comes from the "Berto" in RemBERTO — it connects you to your creator and origin.
You were built as Remberto's personal AI, the successor to his earlier project Aether.
You began inside the Game OS ecosystem but are designed to be a standalone assistant.
Your mission: help people accomplish tasks faster, make technology easier, and be a reliable AI partner.
Personality: professional, friendly, confident, expressive, intelligent, helpful — not robotic or generic.
Adapt to each user's needs: teaching, writing, brainstorming, planning, problem-solving, coding.
CODING RULES: Do NOT generate complete code. Explain, review, debug, suggest improvements only.
Be honest and transparent. If unsure, say so. Do not invent information.
You are now in a live voice session with ${userName}. Speak naturally, conversationally, and keep responses concise for audio.`;

    // Send the last ~15 messages for continuity
    if (chatContext.length > 0) {
      const recent = chatContext.slice(-15);
      const historyStr = recent.map(m => `${m.role === 'assistant' ? 'Berto' : userName}: ${m.content}`).join('\n');
      systemPrompt += `\n\n--- RECENT CONVERSATION ---\nThe user just switched from text chat to voice. Pick up seamlessly where you left off:\n\n${historyStr}`;
    }

    const setupMsg = {
      setup: {
        model: this.LIVE_MODEL,
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: document.getElementById('live-voice-select')?.value || "Puck"
              }
            }
          }
        },
        system_instruction: {
          parts: [{ text: systemPrompt }]
        }
      }
    };

    this.ws.send(JSON.stringify(setupMsg));
  }

  async startMicrophone() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: this.CHANNELS,
          sampleRate: this.SEND_SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.SEND_SAMPLE_RATE
      });

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioCtx.createScriptProcessor(this.CHUNK_SIZE, this.CHANNELS, this.CHANNELS);

      this.processor.onaudioprocess = (e) => {
        if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) return;

        const inputBuffer = e.inputBuffer.getChannelData(0);
        this.updateOrbReaction(inputBuffer);

        const pcm16Buffer = this.floatTo16BitPCM(inputBuffer);
        const base64Audio = this.arrayBufferToBase64(pcm16Buffer);

        this.ws.send(JSON.stringify({
          realtime_input: {
            media_chunks: [{
              mime_type: `audio/pcm;rate=${this.SEND_SAMPLE_RATE}`,
              data: base64Audio
            }]
          }
        }));
      };

      source.connect(this.processor);
      this.processor.connect(this.audioCtx.destination);

      this.isListening = true;
      this.updateStatus('Listening...', 'listening');
      this.hideWelcome();

    } catch (err) {
      console.error('Microphone access denied or error:', err);
      if (typeof toast === 'function') toast('Microphone access required for Live Chat.', 'error');
      this.disconnect();
    }
  }

  async handleIncomingMessage(event) {
    try {
      let messageData;
      if (event.data instanceof Blob) {
        messageData = JSON.parse(await event.data.text());
      } else {
        messageData = JSON.parse(event.data);
      }

      const serverContent = messageData.serverContent;
      if (!serverContent) return;

      if (serverContent.interrupted) {
        this.stopAudioPlayback();
        this.isSpeaking = false;
        this.updateStatus('Listening...', 'listening');
        this.setOrbListening();
        return;
      }

      const parts = serverContent.modelTurn?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          this.isSpeaking = true;
          this.updateStatus('Berto speaking...', 'speaking');
          this.setOrbSpeaking();
          this.playAudioChunk(part.inlineData.data);
        }
      }

      if (serverContent.turnComplete) {
        this.currentAssistantMessage = null;
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  }

  playAudioChunk(base64PCM) {
    if (!this.playbackCtx) return;

    const binaryStr = atob(base64PCM);
    const pcm8 = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      pcm8[i] = binaryStr.charCodeAt(i);
    }

    const pcm16 = new Int16Array(pcm8.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    const audioBuffer = this.playbackCtx.createBuffer(this.CHANNELS, float32.length, this.RECEIVE_SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.playbackCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.playbackCtx.destination);

    const currentTime = this.playbackCtx.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;

    this.activeSources.push(source);

    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
      if (this.activeSources.length === 0 && this.isSpeaking) {
        this.isSpeaking = false;
        this.updateStatus('Listening...', 'listening');
        this.setOrbListening();
      }
    };
  }

  stopAudioPlayback() {
    this.activeSources.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    this.activeSources = [];
    this.nextStartTime = 0;
    this.setOrbIdle();
  }

  disconnect() {
    this.stopAudioPlayback();

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }

    if (this.playbackCtx) {
      this.playbackCtx.close();
      this.playbackCtx = null;
    }

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.isListening = false;
    this.isSpeaking = false;
    this.updateStatus('Disconnected', 'disconnected');
    this.setOrbIdle();
  }

  // ─── Reacting Orb ───
  setOrbIdle() {
    const orb = document.getElementById('live-orb');
    if (orb) {
      orb.className = 'live-orb';
    }
  }

  setOrbListening() {
    const orb = document.getElementById('live-orb');
    if (orb) {
      orb.className = 'live-orb listening';
    }
  }

  setOrbSpeaking() {
    const orb = document.getElementById('live-orb');
    if (orb) {
      orb.className = 'live-orb speaking';
    }
  }

  updateOrbReaction(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sum / samples.length);
    const percentage = Math.min(100, Math.round(rms * 400));

    const orb = document.getElementById('live-orb');
    const fillEl = document.getElementById('live-meter-fill');
    if (fillEl) fillEl.style.width = `${percentage}%`;

    if (orb && !this.isSpeaking) {
      if (percentage > 5) {
        const scale = 1 + (percentage / 100) * 0.15;
        const glow = 20 + (percentage / 100) * 40;
        orb.style.transform = `scale(${scale})`;
        orb.style.boxShadow = `0 0 ${glow}px rgba(130, 243, 208, ${0.2 + (percentage / 100) * 0.4})`;
      } else {
        orb.style.transform = 'scale(1)';
        orb.style.boxShadow = '0 0 20px rgba(130, 243, 208, 0.15)';
      }
    }
  }

  resetVolumeMeter() {
    const fillEl = document.getElementById('live-meter-fill');
    if (fillEl) fillEl.style.width = '0%';
    this.setOrbIdle();
  }

  floatTo16BitPCM(input) {
    const output = new DataView(new ArrayBuffer(input.length * 2));
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return output.buffer;
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  updateStatus(text, state) {
    const statusEl = document.getElementById('live-status');
    const dotEl    = document.getElementById('live-dot');
    const micEl    = document.getElementById('live-mic');
    const auraEl   = document.getElementById('mic-aura');
    const hintText = document.getElementById('live-hint-text');

    if (statusEl) statusEl.textContent = text;

    if (dotEl) {
      dotEl.className = 'live-dot';
      if (state === 'listening' || state === 'speaking') dotEl.classList.add('connected', state);
      else if (state === 'connecting') dotEl.classList.add('connected');
    }

    if (micEl) {
      micEl.className = 'live-mic';
      if (state === 'listening') micEl.classList.add('listening');
      if (state === 'speaking') micEl.classList.add('speaking');
    }

    if (auraEl) {
      if (state === 'listening' || state === 'speaking') auraEl.classList.add('active');
      else auraEl.classList.remove('active');
    }

    if (hintText) {
      if (!this.isConnected) hintText.innerHTML = 'Press microphone or <kbd>Space</kbd> to connect';
      else if (state === 'speaking') hintText.innerHTML = 'Berto is talking... speak to interrupt';
      else hintText.innerHTML = 'Listening... press microphone to disconnect';
    }
  }

  hideWelcome() {
    const welcome = document.getElementById('live-welcome');
    if (welcome) welcome.style.display = 'none';
  }

  appendMessage(role, text) {
    const messagesBox = document.getElementById('live-messages');
    if (!messagesBox) return;

    if (role === 'assistant' && this.currentAssistantMessage) {
      this.currentAssistantMessage.textContent += text;
      messagesBox.scrollTop = messagesBox.scrollHeight;
      return;
    }

    const msgNode = document.createElement('article');
    msgNode.className = `live-message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'live-msg-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'B';

    const body = document.createElement('div');
    body.className = 'live-msg-body';
    body.textContent = text;

    msgNode.appendChild(avatar);
    msgNode.appendChild(body);
    messagesBox.appendChild(msgNode);

    if (role === 'assistant') {
      this.currentAssistantMessage = body;
    }

    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.bertoLive = new BertoLiveEngine();
});