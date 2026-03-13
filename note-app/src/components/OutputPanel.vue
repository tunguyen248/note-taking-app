<script setup>
defineProps({
  loading: { type: Boolean, required: true },
  output: { type: String, default: '' },
  tab: { type: String, required: true },
  renderedMarkdown: { type: String, required: true },
  editedOutput: { type: String, required: true },
  copied: { type: Boolean, required: true },
  wordCount: { type: Number, required: true },
  styleValue: { type: String, required: true },
  detailValue: { type: String, required: true },
})

const emit = defineEmits([
  'update:tab',
  'update:editedOutput',
  'copy',
  'download',
  'regenerate',
])
</script>

<template>
  <div class="panel">
    <div class="panel-header output-header">
      <div class="tabs">
        <button class="tab-btn" :class="{ active: tab === 'preview' }" @click="emit('update:tab', 'preview')">
          Preview
        </button>
        <button class="tab-btn" :class="{ active: tab === 'edit' }" @click="emit('update:tab', 'edit')">
          Edit
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-wrap">
      <div class="spinner" />
      <span class="loading-text">GENERATING NOTES</span>
    </div>

    <template v-else-if="output">
      <div v-if="tab === 'preview'" class="md-preview" v-html="renderedMarkdown" />
      <textarea
        v-else
        class="editor-ta"
        :value="editedOutput"
        :spellcheck="false"
        @input="emit('update:editedOutput', $event.target.value)"
      />

      <div class="output-actions">
        <button class="btn btn-ghost" @click="emit('copy')">{{ copied ? '✓ Copied!' : 'Copy Markdown' }}</button>
        <button class="btn btn-ghost" @click="emit('download')">Download .md</button>
      </div>

      <div class="regen-bar">
        <span class="regen-meta">
          {{ wordCount }} WORDS · {{ styleValue.toUpperCase() }} · {{ detailValue.toUpperCase() }}
        </span>
        <button class="btn btn-ghost regen-btn" :disabled="loading" @click="emit('regenerate')">
          ↺ Regenerate
        </button>
      </div>
    </template>

    <div v-else class="empty-state">
      <span class="empty-icon">📓</span>
      <span class="empty-text">NOTES WILL APPEAR HERE</span>
    </div>
  </div>
</template>
