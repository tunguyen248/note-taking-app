<script setup>
import { computed, ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import HeroSection from './components/HeroSection.vue'
import InputPanel from './components/InputPanel.vue'
import OutputPanel from './components/OutputPanel.vue'
import { useNoteGenerator } from './composables/useNoteGenerator'
import { DETAILS, STYLES } from './constants/noteOptions'
import { renderMarkdown } from './utils/markdown'

const inputText = ref('')
const style = ref('concept')
const detail = ref('medium')
const dragOver = ref(false)

const {
  output,
  editedOutput,
  loading,
  error,
  tab,
  copied,
  generate,
  regenerate,
  copy,
  download,
} = useNoteGenerator()

const wordCount = computed(() => editedOutput.value.split(/\s+/).filter(Boolean).length)
const renderedMarkdown = computed(() => renderMarkdown(editedOutput.value))

async function handleFile(file) {
  if (!file) return

  if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
    inputText.value = await file.text()
    return
  }

  error.value = 'Video/audio transcription not available in demo — please paste a transcript instead.'
}

function handleGenerate() {
  generate({
    text: inputText.value,
    style: style.value,
    detail: detail.value,
  })
}

function handleRegenerate() {
  regenerate({
    style: style.value,
    detail: detail.value,
  })
}
</script>

<template>
  <div class="app">
    <AppHeader />

    <div class="main">
      <HeroSection />

      <div class="grid">
        <InputPanel
          v-model:input-text="inputText"
          v-model:drag-over="dragOver"
          v-model:style-value="style"
          v-model:detail-value="detail"
          :error="error"
          :styles="STYLES"
          :details="DETAILS"
          :loading="loading"
          @generate="handleGenerate"
          @file-selected="handleFile"
        />

        <OutputPanel
          v-model:tab="tab"
          v-model:edited-output="editedOutput"
          :loading="loading"
          :output="output"
          :rendered-markdown="renderedMarkdown"
          :copied="copied"
          :word-count="wordCount"
          :style-value="style"
          :detail-value="detail"
          @copy="copy"
          @download="download"
          @regenerate="handleRegenerate"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.app {
  min-height: 100vh;
  background: #0e0f14;
  font-family: 'Georgia', 'Times New Roman', serif;
  color: #e8e4dc;
}

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

.hero { text-align: center; padding: 48px 0 40px; }

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

.output-header {
  padding: 0;
  display: block;
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

.drop-zone:hover,
.drop-zone.over {
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

.upload-btn { font-size: 11px; padding: 4px 10px; }
.regen-btn { font-size: 11px; }

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

.md-preview :deep(.md-h1) {
  font-family: 'Palatino Linotype', Palatino, serif;
  font-size: 1.6rem;
  font-weight: 400;
  color: #f0ece4;
  margin: 0 0 16px;
  border-bottom: 1px solid #22232e;
  padding-bottom: 10px;
}

.md-preview :deep(.md-h2) {
  font-family: 'Palatino Linotype', Palatino, serif;
  font-size: 1.1rem;
  font-weight: 400;
  color: #a8e8b4;
  margin: 20px 0 10px;
}

.md-preview :deep(.md-h3) {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #d8d4cc;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 14px 0 8px;
}

.md-preview :deep(.md-p) {
  color: #b8b4ac;
  font-size: 0.9rem;
  line-height: 1.7;
  margin-bottom: 8px;
}

.md-preview :deep(.md-ul),
.md-preview :deep(.md-ol) {
  padding-left: 0;
  margin: 4px 0 12px;
  list-style: none;
}

.md-preview :deep(.md-li) {
  color: #b8b4ac;
  font-size: 0.88rem;
  line-height: 1.7;
  padding: 2px 0 2px 18px;
  position: relative;
}

.md-preview :deep(.md-li::before) { content: '–'; position: absolute; left: 2px; color: #4a6e50; }

.md-preview :deep(.md-oli) {
  color: #b8b4ac;
  font-size: 0.88rem;
  line-height: 1.7;
  padding: 3px 0 3px 28px;
  display: flex;
  gap: 8px;
}

.md-preview :deep(.md-onum) {
  color: #6ee97c;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 20px;
}

.md-preview :deep(.md-bq) {
  border-left: 3px solid #3a5a3e;
  padding: 8px 14px;
  background: #13201a;
  color: #8ab090;
  font-size: 0.88rem;
  margin: 12px 0;
  border-radius: 0 2px 2px 0;
}

.md-preview :deep(.md-code) {
  background: #1a1b22;
  border: 1px solid #2a2b38;
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 0.8rem;
  color: #a8d8b4;
}

.md-preview :deep(strong) { color: #e8e4dc; }

.editor-ta {
  width: 100%;
  min-height: 500px;
  background: #0f1015;
  border: none;
  outline: none;
  resize: vertical;
  color: #c8c4bc;
  font-family: 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.75;
  padding: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  opacity: 0.5;
}

.empty-icon { font-size: 3rem; filter: grayscale(1); }
.empty-text { font-family: 'Courier New', monospace; font-size: 12px; color: #4a4c58; letter-spacing: 1px; }

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 20px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #1e2a1f;
  border-top-color: #6ee97c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-text {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #4a6e50;
  letter-spacing: 2px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.error {
  background: #2a1515;
  border: 1px solid #5a2020;
  border-radius: 2px;
  color: #e87878;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 10px 14px;
  margin: 0 16px 12px;
}

.regen-bar {
  padding: 10px 16px;
  border-top: 1px solid #1e1f28;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.regen-meta {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #3a3c48;
  letter-spacing: 1px;
}

.input-hint {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #3a3c48;
  padding: 0 16px 12px;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .nav { padding: 14px 16px; }
  .main { padding: 20px 16px; }
}
</style>
