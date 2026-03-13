import { ref } from 'vue'
import { SYSTEM_PROMPT } from '../constants/noteOptions'

export function useNoteGenerator() {
  const output = ref('')
  const editedOutput = ref('')
  const loading = ref(false)
  const error = ref('')
  const tab = ref('preview')
  const copied = ref(false)
  const sourceText = ref('')

  async function generate({ text, style, detail }) {
    if (!text.trim()) {
      error.value = 'Please provide some content first.'
      return
    }

    error.value = ''
    loading.value = true
    output.value = ''
    editedOutput.value = ''
    sourceText.value = text

    const userPrompt = `Style: ${style}\nDetail level: ${detail}\nAudience: student\n\nSource content:\n${text}`

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
      const md = data?.content?.filter(block => block.type === 'text').map(block => block.text).join('') || ''

      if (!md) {
        throw new Error('Empty response from AI')
      }

      output.value = md
      editedOutput.value = md
      tab.value = 'preview'
    } catch {
      error.value = 'Generation failed. Please try again.'
    } finally {
      loading.value = false
    }
  }

  function regenerate({ style, detail }) {
    return generate({ text: sourceText.value, style, detail })
  }

  function copy() {
    navigator.clipboard.writeText(editedOutput.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }

  function download() {
    const blob = new Blob([editedOutput.value], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'notes.md'
    a.click()
  }

  return {
    output,
    editedOutput,
    loading,
    error,
    tab,
    copied,
    sourceText,
    generate,
    regenerate,
    copy,
    download,
  }
}
