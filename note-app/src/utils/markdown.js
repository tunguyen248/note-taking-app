export function renderMarkdown(md) {
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

  html = html.replace(/(<li class="md-li">.*?<\/li>\n?)+/gs, match => `<ul class="md-ul">${match}</ul>`)
  html = html.replace(/(<li class="md-oli">.*?<\/li>\n?)+/gs, match => `<ol class="md-ol">${match}</ol>`)
  html = html
    .split('\n')
    .map(line => {
      if (/^<(h[123]|ul|ol|li|blockquote)/.test(line.trim()) || line.trim() === '') return line
      return line ? `<p class="md-p">${line}</p>` : ''
    })
    .join('\n')

  return html
}
