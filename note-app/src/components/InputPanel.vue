<script setup>
import { ref } from 'vue'

defineProps({
  inputText: { type: String, required: true },
  dragOver: { type: Boolean, required: true },
  error: { type: String, default: '' },
  styleValue: { type: String, required: true },
  detailValue: { type: String, required: true },
  styles: { type: Array, required: true },
  details: { type: Array, required: true },
  loading: { type: Boolean, required: true },
})

const emit = defineEmits([
  'update:inputText',
  'update:dragOver',
  'update:styleValue',
  'update:detailValue',
  'generate',
  'file-selected',
])

const fileInput = ref(null)

function openFilePicker() {
  fileInput.value?.click()
}

function onFileChange(event) {
  emit('file-selected', event.target.files?.[0])
}

function onDrop(event) {
  emit('update:dragOver', false)
  emit('file-selected', event.dataTransfer.files?.[0])
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <span class="panel-label">Source Content</span>
      <button class="btn btn-ghost upload-btn" @click="openFilePicker">
        ↑ Upload File
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".txt,.md,.mp4,.mp3,.m4a,.wav"
        style="display: none"
        @change="onFileChange"
      />
    </div>

    <textarea
      class="textarea"
      placeholder="Paste your transcript, lecture notes, or raw text here…&#10;&#10;Works best with educational and technical content."
      :value="inputText"
      @input="emit('update:inputText', $event.target.value)"
    />

    <div
      class="drop-zone"
      :class="{ over: dragOver }"
      @dragover.prevent="emit('update:dragOver', true)"
      @dragleave="emit('update:dragOver', false)"
      @drop.prevent="onDrop"
      @click="openFilePicker"
    >
      <p class="drop-text">Drop .txt or .md file here — or click to browse</p>
    </div>

    <div v-if="error" class="error">⚠ {{ error }}</div>

    <div class="controls">
      <div class="ctrl-group">
        <span class="ctrl-label">Style</span>
        <div class="pill-group">
          <button
            v-for="s in styles"
            :key="s.id"
            class="pill"
            :class="{ active: styleValue === s.id }"
            :title="s.desc"
            @click="emit('update:styleValue', s.id)"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <div class="ctrl-group">
        <span class="ctrl-label">Detail</span>
        <div class="pill-group">
          <button
            v-for="d in details"
            :key="d.id"
            class="pill"
            :class="{ active: detailValue === d.id }"
            @click="emit('update:detailValue', d.id)"
          >
            {{ d.label }}
          </button>
        </div>
      </div>

      <button class="btn btn-primary" :disabled="loading || !inputText.trim()" @click="emit('generate')">
        {{ loading ? 'Generating…' : 'Generate Notes →' }}
      </button>
    </div>

    <p class="input-hint">
      CHARACTER COUNT: {{ inputText.length.toLocaleString() }} — Aim for 500+ chars for best results
    </p>
  </div>
</template>
