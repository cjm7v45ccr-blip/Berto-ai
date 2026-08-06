# Berto · AI Workspace

> A calm, capable, and private AI workspace designed for thinking, writing, and getting things done.

Berto is an all-in-one personal AI companion and productivity workspace. Designed to feel lightweight, fluid, and uncluttered, Berto helps you research topics, draft content in your personal style, interact through live voice and video, preview interactive web artifacts, analyze documents, and retain long-term memories—all within a private, local-first environment.

---

## 🌟 Key Features

### 💬 Intelligent Chat & Thinking Partner
* **Adaptive AI Models**: Switch seamlessly between fast, lightweight models for daily queries and advanced reasoning models for complex tasks.
* **Long-Term Persistent Memory**: Berto remembers facts, preferences, and details about you across chats, refreshes, and voice sessions using a local IndexedDB memory engine.
* **Interactive Data & Visuals**: Renders mathematical formulas (KaTeX), structured data tables, interactive Chart.js charts, and Mermaid flowcharts directly in your conversation.
* **Code Sandbox & Execution**: Formats code cleanly with syntax highlighting, one-click copying, and instant live execution for web components.
* **Conversation Branching (Forking)**: Branch off from any message in your history to explore alternative ideas without losing your original chat.

### 🎙️ Berto Live (Real-Time Voice & Vision)
* **Natural Voice Conversations**: Talk to Berto out loud with ultra-low latency speech, natural pacing, and dynamic voice tone switching (Kore, Puck, Charon, Fenrir, Aoede, Leda, Orus, Zephyr).
* **Live Camera & Screen Vision**: Share your live video camera feed or screen share so Berto can see what you see, analyze objects, or troubleshoot on-screen work in real time with immediate frame capture.
* **Floating Live Summaries**: Pop up live summary cards on-screen during voice calls without interrupting the session flow.
* **Text-to-Speech / Read Aloud**: Hear any chat response read out loud naturally with a single click.
* **Voice Dictation**: Dictate notes, ideas, or prompts hands-free anywhere in the workspace.
* **Real-Time Session Metrics**: Displays Bento Grid audio signal levels, sample rates, session timers, and active vision feeds during live calls.

### 🧠 Client-Side Semantic RAG & Document Analysis
* **Local Semantic Search**: Chunks large documents (PDFs, Word docs, Spreadsheets, code files) and ranks relevant excerpts client-side using zero-backend semantic scoring before feeding context to the AI.
* **Spreadsheet Parsing**: Extracts and formats `.xlsx`, `.xls`, and `.csv` sheets into structured Markdown tables or Chart.js visualizations.
* **Integrated Camera Capture**: Snap photos directly from your device camera and attach them to your prompt for instant visual analysis.

### ✍️ Writing Studio & Style Cloning
* **Personal Style Matching**: Train Berto on your actual writing samples so drafts naturally mimic your sentence structure, rhythm, and vocabulary.
* **Structured Formatting**: Generate tailored content specifically structured for Essays, Professional Emails, Executive Summaries, Blog Posts, Reports, Resumes, and Cover Letters.
* **Real-Time Writing Metrics**: Track word counts and readability scores as you type or generate content.
* **Export Options**: Export your completed drafts to standard Markdown (`.md`) or plain text (`.txt`) files instantly.

### 🎨 Live Workspace Artifacts
* **Split-Screen Interactive Drawer**: Renders interactive web components, apps, tools, and visual layouts in a dedicated preview panel next to your chat.
* **Dynamic Artifact Patching**: Berto can programmatically patch specific HTML elements or update content inside active artifacts without re-rendering the whole page.
* **Pop-Out & Download**: View generated artifacts in a full-screen standalone browser tab or download them as ready-to-use HTML files.

### ⚡ Agentic UI Automation & Safety
* **UI Automation Agent**: Ask Berto in plain language to navigate the workspace, switch themes, open the camera, draft in the Writing Studio, or auto-fill inputs.
* **Human-in-the-Loop Safety**: Interactive approval cards require user confirmation before executing destructive actions (such as deleting chats or wiping local data).
* **Self-Correction Feedback Loop**: Generates error report cards with suggested fixes if a UI automation step fails.
* **Dynamic Web Search**: Date-augmented real-time search scraping Google News RSS and DuckDuckGo with current temporal context.
* **Slash Command Palette**: Type `/` in the prompt box for quick commands (`/write`, `/voice`, `/theme`, `/clear`).

### 💎 Custom Gems & Personas
* **Pre-Built Experts**: Switch between built-in personas tailored for software architecture, strict editing, guided tutoring, or UI/UX design.
* **Custom Gem Creator**: Build and save your own custom AI personas with custom system prompts, specialized instructions, and vector icons.

### 🔒 Privacy & Personalization
* **Bring Your Own Key (BYOK)**: Connect Berto directly using your own API key. Your key is stored strictly on your device.
* **100% Local Privacy**: Your chat history, drafts, memories, uploaded files, and preferences remain on your local machine.
* **Modern Aesthetic & Themes**: Includes Dark Mode and Light Mode with fluid liquid transitions, motion preferences, and adjustable UI density.
* **Full Data Ownership**: Export or import your entire workspace backup file anytime with one click.

---

## 🚀 Getting Started

Berto runs completely within your web browser with no server installation required.

1. **Open Berto**: Open `index.html` in any modern web browser.
2. **Enter Your Key**: On your first visit, enter your Gemini API key when prompted.
3. **Start Creating**: Begin chatting, testing long-term memory, drafting in the Writing Studio, or launching Berto Live Voice immediately!

---

## 💡 Quick Tips

* **Memory**: Tell Berto *"Remember that my dog's name is Milo"*, then start a new chat and ask *"What is my dog's name?"*.
* **Search**: Press `⌘ K` (or `Ctrl K`) to open the instant search palette.
* **Commands**: Type `/` in the prompt box to trigger quick workspace commands.
* **Read Aloud**: Click the **Read Aloud** button on any response to hear Berto speak.
* **Drag & Drop**: Drag and drop files anywhere onto the chat window to include them in your prompt.

---

## 📁 Repository Structure

```text
Berto/
├── index.html
├── manifest.webmanifest
├── css/
│   ├── variables.css      # Design tokens, themes, animations, & keyframes
│   ├── layout.css         # App shell, ambient background, sidebar, & topbar
│   ├── chat.css           # Chat messages, composer, code blocks, tables, & math
│   ├── writing.css        # Writing studio canvas, toolbar, & cards
│   ├── voice.css          # Voice stage, bento metrics, & video feeds
│   ├── settings.css       # Settings panels, controls, switches, & sliders
│   └── components.css     # Modals, setup overlay, toasts, & artifact resizer
└── js/
    ├── db.js              # IndexedDB storage engine & Long-Term Memory Engine
    ├── config.js          # App config, constants, & prompt policies
    ├── store.js           # State management & persistence
    ├── api.js             # ModelRouter, Gemini API, & Date-Augmented Web Search
    ├── agent.js           # UI Automation Agent, approvals, & self-correction
    ├── gems.js            # Custom Personas & SVG Icon Manager
    ├── views/
    │   ├── chat.js        # Chat UI, prompt input, & streaming
    │   ├── writing.js     # Writing Studio, dictation, & style cloning
    │   ├── files.js       # Files library & Client-Side RAG
    │   └── settings.js    # Settings UI & First-Time Setup Overlay
    ├── live.js            # Real-time Voice & Vision Engine (WebSocket / WebRTC)
    └── app.js             # App initialization, event delegation, & slash commands

Copyright © 2026 Remberto Valenzuela. All rights reserved.