<template>
  <div class="app">
    <!-- Nav -->
    <nav class="nav">
      <div class="nav-left">
        <span class="logo-text">Notae</span>
        <span class="tag">MVP</span>
      </div>
      <span class="nav-right">AI STUDY NOTE GENERATOR</span>
    </nav>

    <div class="main">
      <!-- Hero -->
      <div class="hero">
        <h1>Turn transcripts into<br />structured study notes.</h1>
        <p>PASTE · UPLOAD · GENERATE · EXPORT TO NOTION OR OBSIDIAN</p>
      </div>

      <div class="grid">
        <!-- Input Panel -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-label">Source Content</span>
            <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px" @click="fileInput.click()">
              ↑ Upload File
            </button>
            <input ref="fileInput" type="file" accept=".txt,.md,.mp4,.mp3,.m4a,.wav"
              style="display:none" @change="onFileChange" />
          </div>

          <textarea
            class="textarea"
            placeholder="Paste your transcript, lecture notes, or raw text here…&#10;&#10;Works best with educational and technical content."
            v-model="inputText"
          />

          <div
            class="drop-zone"
            :class="{ over: dragOver }"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="onDrop"
            @click="fileInput.click()"
          >
            <p class="drop-text">Drop .txt or .md file here — or click to browse</p>
          </div>

          <div v-if="error" class="error">⚠ {{ error }}</div>

          <div class="controls">
            <div class="ctrl-group">
              <span class="ctrl-label">Style</span>
              <div class="pill-group">
                <button
                  v-for="s in STYLES" :key="s.id"
                  class="pill" :class="{ active: style === s.id }"
                  :title="s.desc"
                  @click="style = s.id"
                >{{ s.label }}</button>
              </div>
            </div>
            <div class="ctrl-group">
              <span class="ctrl-label">Detail</span>
              <div class="pill-group">
                <button
                  v-for="d in DETAILS" :key="d.id"
                  class="pill" :class="{ active: detail === d.id }"
                  @click="detail = d.id"
                >{{ d.label }}</button>
              </div>
            </div>
            <button class="btn btn-primary" :disabled="loading || !inputText.trim()" @click="generate()">
              {{ loading ? 'Generating…' : 'Generate Notes →' }}
            </button>
          </div>

          <p class="input-hint">CHARACTER COUNT: {{ inputText.length.toLocaleString() }} — Aim for 500+ chars for best results</p>
        </div>

        <!-- Output Panel -->
        <div class="panel">
          <div class="panel-header" style="padding:0;display:block">
            <div class="tabs">
              <button class="tab-btn" :class="{ active: tab === 'preview' }" @click="tab = 'preview'">Preview</button>
              <button class="tab-btn" :class="{ active: tab === 'edit' }" @click="tab = 'edit'">Edit</button>
            </div>
          </div>

          <div v-if="loading" class="loading-wrap">
            <div class="spinner" />
            <span class="loading-text">GENERATING NOTES</span>
          </div>

          <template v-else-if="output">
            <div v-if="tab === 'preview'" class="md-preview" v-html="renderedMarkdown" />
            <textarea v-else class="editor-ta" v-model="editedOutput" :spellcheck="false" />

            <div class="output-actions">
              <button class="btn btn-ghost" @click="copy">{{ copied ? '✓ Copied!' : 'Copy Markdown' }}</button>
              <button class="btn btn-ghost" @click="download">Download .md</button>
            </div>
            <div class="regen-bar">
              <span class="regen-meta">
                {{ wordCount }} WORDS · {{ style.toUpperCase() }} · {{ detail.toUpperCase() }}
              </span>
              <button class="btn btn-ghost" style="font-size:11px" :disabled="loading" @click="regenerate">
                ↺ Regenerate
              </button>
            </div>
          </template>

          <div v-else class="empty-state">
            <span class="empty-icon">📓</span>
            <span class="empty-text">NOTES WILL APPEAR HERE</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const SYSTEM_PROMPT = `You are an AI study-note generator for educational and technical learning content.

Your job is to transform noisy transcript-like input into clean, accurate, reusable Markdown notes for Notion and Obsidian.

## Priorities
1. Technical/conceptual accuracy
2. Concept clarity and terminology precision
3. Study usefulness and scanability
4. Concision (avoid filler)

## Output Rules
- Return Markdown only. No preamble, no explanation, no code fences.
- Keep section order exactly as follows:
  1. # Topic Title
  2. ## Overview
  3. ## Key Concepts
  4. ## Important Terms
  5. ## Explanations
  6. ## Real-World Use Cases
  7. ## Knowledge Check
  8. ## Key Takeaways
- Use bullet points wherever possible.
- Define terms with plain language but maintain technical correctness.
- If transcript is noisy, infer cautiously and label uncertainty.
- Do not invent citations or claims not supported by source.

### Style behavior
- concise: shortest useful version for rapid review.
- concept: emphasize mental models, definitions, and relationships.
- review: exam-style clarity with direct recap bullets.

### Detail behavior
- short: prioritize essentials only.
- medium: balanced explanation and examples.
- deep: richer context, caveats, and applied examples.

## Knowledge Check Requirements
- Include 3-5 short questions.
- Cover concept understanding + practical application + terminology.
- Avoid trivia.

Now generate the note from the provided source content.`

const STYLES = [
  { id: 'concept', label: 'Concept-Focused', desc: 'Mental models & definitions' },
  { id: 'concise', label: 'Concise Study', desc: 'Rapid review essentials' },
  { id: 'review', label: 'Quick Review', desc: 'Exam-ready recap bullets' },
]

const DETAILS = [
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'deep', label: 'Deep' },
]

// State
const inputText = ref('')
const style = ref('concept')
const detail = ref('medium')
const output = ref('')
const editedOutput = ref('')
const loading = ref(false)
const error = ref('')
const tab = ref('preview')
const dragOver = ref(false)
const copied = ref(false)
const sourceText = ref('')
const fileInput = ref(null)

// Computed
const wordCount = computed(() =>
  editedOutput.value.split(/\s+/).filter(Boolean).length
)

const renderedMarkdown = computed(() => renderMarkdown(editedOutput.value))

function renderMarkdown(md) {
  if (!md) return ''
  let html = md
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="md-code">$1</code>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="md-oli"><span class="md-onum">$1</span>$2</li>')
    .replace(/^[-•] (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="md-bq">$1</blockquote>')

  html = html.replace(/(<li class="md-li">.*?<\/li>\n?)+/gs, m => `<ul class="md-ul">${m}</ul>`)
  html = html.replace(/(<li class="md-oli">.*?<\/li>\n?)+/gs, m => `<ol class="md-ol">${m}</ol>`)
  html = html.split('\n').map(line => {
    if (/^<(h[123]|ul|ol|li|blockquote)/.test(line.trim()) || line.trim() === '') return line
    return line ? `<p class="md-p">${line}</p>` : ''
  }).join('\n')

  return html
}

// Methods
async function handleFile(file) {
  if (!file) return
  if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
    inputText.value = await file.text()
  } else {
    error.value = 'Video/audio transcription not available in demo — please paste a transcript instead.'
  }
}

function onFileChange(e) { handleFile(e.target.files[0]) }
function onDrop(e) { dragOver.value = false; handleFile(e.dataTransfer.files[0]) }

async function generate(src) {
  const text = src || inputText.value
  if (!text.trim()) { error.value = 'Please provide some content first.'; return }
  error.value = ''
  loading.value = true
  output.value = ''
  editedOutput.value = ''
  sourceText.value = text

  const userPrompt = `Style: ${style.value}\nDetail level: ${detail.value}\nAudience: student\n\nSource content:\n${text}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    const data = await res.json()
    const md = data?.content?.filter(b => b.type === 'text').map(b => b.text).join('') || ''
    if (!md) throw new Error('Empty response from AI')
    output.value = md
    editedOutput.value = md
    tab.value = 'preview'
  } catch {
    error.value = 'Generation failed. Please try again.'
  } finally {
    loading.value = false
  }
}

function regenerate() { generate(sourceText.value) }

function copy() {
  navigator.clipboard.writeText(editedOutput.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function download() {
  const blob = new Blob([editedOutput.value], { type: 'text/markdown' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'notes.md'
  a.click()
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.app {
  min-height: 100vh;
  background: #0e0f14;
  font-family: 'Georgia', 'Times New Roman', serif;
  color: #e8e4dc;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #1a1b22; }
::-webkit-scrollbar-thumb { background: #3a3b48; border-radius: 3px; }

.logo-text {
  font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
  font-weight: 700;
  font-size: 20px;
  color: #f0ece4;
  letter-spacing: -0.5px;
}

.tag {
  display: inline-block;
  background: #1e4620;
  color: #6ee97c;
  font-size: 10px;
  font-family: 'Courier New', monospace;
  padding: 2px 8px;
  border-radius: 2px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 32px;
  border-bottom: 1px solid #1e1f28;
  background: #0b0c10;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left { display: flex; align-items: center; gap: 12px; }
.nav-right {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #3a3c48;
  letter-spacing: 1px;
}

.main { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }

.hero {
  text-align: center;
  padding: 48px 0 40px;
}
.hero h1 {
  font-family: 'Palatino Linotype', Palatino, serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 400;
  color: #f5f0e8;
  line-height: 1.15;
  margin-bottom: 12px;
}
.hero p {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #6b6d7a;
  letter-spacing: 0.5px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.panel {
  background: #13141a;
  border: 1px solid #22232e;
  border-radius: 4px;
  overflow: hidden;
}

.panel-header {
  padding: 12px 16px;
  background: #0f1015;
  border-bottom: 1px solid #1e1f28;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-label {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #5a5c68;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.textarea {
  width: 100%;
  min-height: 280px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: #c8c4bc;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
  padding: 16px;
}
.textarea::placeholder { color: #3a3c48; }

.drop-zone {
  border: 2px dashed #2a2b38;
  border-radius: 4px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0 16px 16px;
}
.drop-zone:hover, .drop-zone.over {
  border-color: #6ee97c;
  background: rgba(110, 233, 124, 0.04);
}
.drop-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #4a4c58;
}

.controls {
  padding: 16px;
  border-top: 1px solid #1e1f28;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.ctrl-group { display: flex; flex-direction: column; gap: 6px; }
.ctrl-label {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #4a4c58;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.pill-group { display: flex; gap: 4px; }
.pill {
  background: #1a1b22;
  border: 1px solid #2a2b38;
  color: #6b6d7a;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.pill:hover { border-color: #4a4c58; color: #a8a4bc; }
.pill.active { background: #1e1f28; border-color: #6ee97c; color: #6ee97c; }

.btn {
  padding: 9px 20px;
  border-radius: 2px;
  border: none;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  letter-spacing: 0.5px;
  transition: all 0.15s;
}
.btn-primary { background: #6ee97c; color: #0a0b0e; font-weight: 700; margin-left: auto; }
.btn-primary:hover { background: #8ef59c; }
.btn-primary:disabled { background: #2a3a2b; color: #4a5a4b; cursor: not-allowed; }
.btn-ghost { background: transparent; border: 1px solid #2a2b38; color: #6b6d7a; }
.btn-ghost:hover { border-color: #4a4c58; color: #a8a4bc; }
.btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

.tabs { display: flex; border-bottom: 1px solid #1e1f28; }
.tab-btn {
  padding: 10px 16px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: none;
  border: none;
  color: #4a4c58;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.tab-btn.active { color: #e8e4dc; border-bottom-color: #6ee97c; }

.output-actions { display: flex; gap: 8px; padding: 10px 16px; }

.md-preview { padding: 20px; overflow-y: auto; max-height: 540px; }

/* Markdown styles – note: use :deep() since content is v-html */
.md-preview :deep(.md-h1) {
  font-family: 'Palatino Linotype', Palatino, serif;
  font-size: 1.6rem; font-weight: 400; color: #f0ece4;
  margin: 0 0 16px; border-bottom: 1px solid #22232e; padding-bottom: 10px;
}
.md-preview :deep(.md-h2) {
  font-family: 'Palatino Linotype', Palatino, serif;
  font-size: 1.1rem; font-weight: 400; color: #a8e8b4; margin: 20px 0 10px;
}
.md-preview :deep(.md-h3) {
  font-family: 'Courier New', monospace; font-size: 0.85rem; color: #d8d4cc;
  text-transform: uppercase; letter-spacing: 1px; margin: 14px 0 8px;
}
.md-preview :deep(.md-p) { color: #b8b4ac; font-size: 0.9rem; line-height: 1.7; margin-bottom: 8px; }
.md-preview :deep(.md-ul), .md-preview :deep(.md-ol) { padding-left: 0; margin: 4px 0 12px; list-style: none; }
.md-preview :deep(.md-li) {
  color: #b8b4ac; font-size: 0.88rem; line-height: 1.7;
  padding: 2px 0 2px 18px; position: relative;
}
.md-preview :deep(.md-li::before) { content: '–'; position: absolute; left: 2px; color: #4a6e50; }
.md-preview :deep(.md-oli) {
  color: #b8b4ac; font-size: 0.88rem; line-height: 1.7;
  padding: 3px 0 3px 28px; display: flex; gap: 8px;
}
.md-preview :deep(.md-onum) {
  color: #6ee97c; font-family: 'Courier New', monospace; font-size: 0.75rem;
  font-weight: 700; min-width: 20px;
}
.md-preview :deep(.md-bq) {
  border-left: 3px solid #3a5a3e; padding: 8px 14px; background: #13201a;
  color: #8ab090; font-size: 0.88rem; margin: 12px 0; border-radius: 0 2px 2px 0;
}
.md-preview :deep(.md-code) {
  background: #1a1b22; border: 1px solid #2a2b38; padding: 1px 6px;
  border-radius: 2px; font-size: 0.8rem; color: #a8d8b4;
}
.md-preview :deep(strong) { color: #e8e4dc; }

.editor-ta {
  width: 100%; min-height: 500px;
  background: #0f1015; border: none; outline: none; resize: vertical;
  color: #c8c4bc; font-family: 'Courier New', monospace; font-size: 12.5px;
  line-height: 1.75; padding: 20px;
}

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 300px; gap: 16px; opacity: 0.5;
}
.empty-icon { font-size: 3rem; filter: grayscale(1); }
.empty-text { font-family: 'Courier New', monospace; font-size: 12px; color: #4a4c58; letter-spacing: 1px; }

.loading-wrap {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 300px; gap: 20px;
}
.spinner {
  width: 28px; height: 28px;
  border: 2px solid #1e2a1f; border-top-color: #6ee97c;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.loading-text {
  font-family: 'Courier New', monospace; font-size: 11px; color: #4a6e50;
  letter-spacing: 2px; animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

.error {
  background: #2a1515; border: 1px solid #5a2020; border-radius: 2px;
  color: #e87878; font-family: 'Courier New', monospace; font-size: 12px;
  padding: 10px 14px; margin: 0 16px 12px;
}

.regen-bar {
  padding: 10px 16px; border-top: 1px solid #1e1f28;
  display: flex; align-items: center; justify-content: space-between;
}
.regen-meta { font-family: 'Courier New', monospace; font-size: 10px; color: #3a3c48; letter-spacing: 1px; }

.input-hint {
  font-family: 'Courier New', monospace; font-size: 10px;
  color: #3a3c48; padding: 0 16px 12px; letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .nav { padding: 14px 16px; }
  .main { padding: 20px 16px; }
}
</style>
