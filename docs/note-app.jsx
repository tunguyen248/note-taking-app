import { useState, useRef, useCallback } from "react";

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

Now generate the note from the provided source content.`;

const STYLES = [
  { id: "concept", label: "Concept-Focused", desc: "Mental models & definitions" },
  { id: "concise", label: "Concise Study", desc: "Rapid review essentials" },
  { id: "review", label: "Quick Review", desc: "Exam-ready recap bullets" },
];

const DETAILS = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "deep", label: "Deep" },
];

function renderMarkdown(md) {
  if (!md) return "";
  let html = md
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="md-code">$1</code>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="md-oli"><span class="md-onum">$1</span>$2</li>')
    .replace(/^[-•] (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="md-bq">$1</blockquote>');

  html = html.replace(/(<li class="md-li">.*?<\/li>\n?)+/gs, m => `<ul class="md-ul">${m}</ul>`);
  html = html.replace(/(<li class="md-oli">.*?<\/li>\n?)+/gs, m => `<ol class="md-ol">${m}</ol>`);
  html = html.split('\n').map(line => {
    if (/^<(h[123]|ul|ol|li|blockquote)/.test(line.trim()) || line.trim() === '') return line;
    return line ? `<p class="md-p">${line}</p>` : '';
  }).join('\n');

  return html;
}

export default function NoteApp() {
  const [inputText, setInputText] = useState("");
  const [style, setStyle] = useState("concept");
  const [detail, setDetail] = useState("medium");
  const [output, setOutput] = useState("");
  const [editedOutput, setEditedOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("preview");
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
      const text = await file.text();
      setInputText(text);
    } else {
      setError("Video/audio transcription not available in demo — please paste a transcript instead.");
    }
  };

  const generate = useCallback(async (src) => {
    const text = src || inputText;
    if (!text.trim()) { setError("Please provide some content first."); return; }
    setError("");
    setLoading(true);
    setOutput("");
    setEditedOutput("");
    const used = src || inputText;
    setSourceText(used);

    const userPrompt = `Style: ${style}\nDetail level: ${detail}\nAudience: student\n\nSource content:\n${used}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const data = await res.json();
      const md = data?.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
      if (!md) throw new Error("Empty response from AI");
      setOutput(md);
      setEditedOutput(md);
      setTab("preview");
    } catch (e) {
      setError("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [inputText, style, detail]);

  const regenerate = () => generate(sourceText);

  const copy = () => {
    navigator.clipboard.writeText(editedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([editedOutput], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "notes.md";
    a.click();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0e0f14", fontFamily: "'Georgia', 'Times New Roman', serif", color: "#e8e4dc" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #1a1b22; } ::-webkit-scrollbar-thumb { background: #3a3b48; border-radius: 3px; }
        .logo-text { font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif; font-weight: 700; letter-spacing: -0.5px; }
        .tag { display: inline-block; background: #1e4620; color: #6ee97c; font-size: 10px; font-family: 'Courier New', monospace; padding: 2px 8px; border-radius: 2px; letter-spacing: 1px; text-transform: uppercase; }
        .nav { display: flex; align-items: center; justify-content: space-between; padding: 18px 32px; border-bottom: 1px solid #1e1f28; background: #0b0c10; position: sticky; top: 0; z-index: 100; }
        .main { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
        .hero { text-align: center; padding: 48px 0 40px; }
        .hero h1 { font-family: 'Palatino Linotype', Palatino, serif; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 400; color: #f5f0e8; line-height: 1.15; margin-bottom: 12px; }
        .hero p { font-family: 'Courier New', monospace; font-size: 13px; color: #6b6d7a; letter-spacing: 0.5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } .nav { padding: 14px 16px; } .main { padding: 20px 16px; } }
        .panel { background: #13141a; border: 1px solid #22232e; border-radius: 4px; overflow: hidden; }
        .panel-header { padding: 12px 16px; background: #0f1015; border-bottom: 1px solid #1e1f28; display: flex; align-items: center; justify-content: space-between; }
        .panel-label { font-family: 'Courier New', monospace; font-size: 11px; color: #5a5c68; letter-spacing: 1.5px; text-transform: uppercase; }
        .textarea { width: 100%; min-height: 280px; background: transparent; border: none; outline: none; resize: none; color: #c8c4bc; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.7; padding: 16px; }
        .textarea::placeholder { color: #3a3c48; }
        .drop-zone { border: 2px dashed #2a2b38; border-radius: 4px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s; margin: 0 16px 16px; }
        .drop-zone:hover, .drop-zone.over { border-color: #6ee97c; background: rgba(110, 233, 124, 0.04); }
        .drop-text { font-family: 'Courier New', monospace; font-size: 12px; color: #4a4c58; }
        .controls { padding: 16px; border-top: 1px solid #1e1f28; display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
        .ctrl-group { display: flex; flex-direction: column; gap: 6px; }
        .ctrl-label { font-family: 'Courier New', monospace; font-size: 10px; color: #4a4c58; letter-spacing: 1px; text-transform: uppercase; }
        .pill-group { display: flex; gap: 4px; }
        .pill { background: #1a1b22; border: 1px solid #2a2b38; color: #6b6d7a; font-family: 'Courier New', monospace; font-size: 11px; padding: 5px 12px; border-radius: 2px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .pill:hover { border-color: #4a4c58; color: #a8a4bc; }
        .pill.active { background: #1e1f28; border-color: #6ee97c; color: #6ee97c; }
        .btn { padding: 9px 20px; border-radius: 2px; border: none; cursor: pointer; font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 0.5px; transition: all 0.15s; }
        .btn-primary { background: #6ee97c; color: #0a0b0e; font-weight: 700; margin-left: auto; }
        .btn-primary:hover { background: #8ef59c; }
        .btn-primary:disabled { background: #2a3a2b; color: #4a5a4b; cursor: not-allowed; }
        .btn-ghost { background: transparent; border: 1px solid #2a2b38; color: #6b6d7a; }
        .btn-ghost:hover { border-color: #4a4c58; color: #a8a4bc; }
        .tabs { display: flex; gap: 0; border-bottom: 1px solid #1e1f28; }
        .tab-btn { padding: 10px 16px; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; background: none; border: none; color: #4a4c58; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; }
        .tab-btn.active { color: #e8e4dc; border-bottom-color: #6ee97c; }
        .output-actions { display: flex; gap: 8px; padding: 10px 16px; }
        .md-preview { padding: 20px; overflow-y: auto; max-height: 540px; }
        .md-h1 { font-family: 'Palatino Linotype', Palatino, serif; font-size: 1.6rem; font-weight: 400; color: #f0ece4; margin: 0 0 16px; border-bottom: 1px solid #22232e; padding-bottom: 10px; }
        .md-h2 { font-family: 'Palatino Linotype', Palatino, serif; font-size: 1.1rem; font-weight: 400; color: #a8e8b4; margin: 20px 0 10px; }
        .md-h3 { font-family: 'Courier New', monospace; font-size: 0.85rem; color: #d8d4cc; text-transform: uppercase; letter-spacing: 1px; margin: 14px 0 8px; }
        .md-p { color: #b8b4ac; font-size: 0.9rem; line-height: 1.7; margin-bottom: 8px; }
        .md-ul, .md-ol { padding-left: 0; margin: 4px 0 12px; list-style: none; }
        .md-li { color: #b8b4ac; font-size: 0.88rem; line-height: 1.7; padding: 2px 0 2px 18px; position: relative; }
        .md-li::before { content: '–'; position: absolute; left: 2px; color: #4a6e50; }
        .md-oli { color: #b8b4ac; font-size: 0.88rem; line-height: 1.7; padding: 3px 0 3px 28px; position: relative; display: flex; gap: 8px; }
        .md-onum { color: #6ee97c; font-family: 'Courier New', monospace; font-size: 0.75rem; font-weight: 700; min-width: 20px; }
        .md-bq { border-left: 3px solid #3a5a3e; padding: 8px 14px; background: #13201a; color: #8ab090; font-size: 0.88rem; margin: 12px 0; border-radius: 0 2px 2px 0; }
        .md-code { background: #1a1b22; border: 1px solid #2a2b38; padding: 1px 6px; border-radius: 2px; font-size: 0.8rem; color: #a8d8b4; }
        .md-preview strong { color: #e8e4dc; }
        .editor-ta { width: 100%; min-height: 500px; background: #0f1015; border: none; outline: none; resize: vertical; color: #c8c4bc; font-family: 'Courier New', monospace; font-size: 12.5px; line-height: 1.75; padding: 20px; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 16px; opacity: 0.5; }
        .empty-icon { font-size: 3rem; filter: grayscale(1); }
        .empty-text { font-family: 'Courier New', monospace; font-size: 12px; color: #4a4c58; letter-spacing: 1px; }
        .loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 20px; }
        .spinner { width: 28px; height: 28px; border: 2px solid #1e2a1f; border-top-color: #6ee97c; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { font-family: 'Courier New', monospace; font-size: 11px; color: #4a6e50; letter-spacing: 2px; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        .error { background: #2a1515; border: 1px solid #5a2020; border-radius: 2px; color: #e87878; font-family: 'Courier New', monospace; font-size: 12px; padding: 10px 14px; margin: 0 16px 12px; }
        .regen-bar { padding: 10px 16px; border-top: 1px solid #1e1f28; display: flex; align-items: center; justify-content: space-between; }
        .regen-meta { font-family: 'Courier New', monospace; font-size: 10px; color: #3a3c48; letter-spacing: 1px; }
        .input-hint { font-family: 'Courier New', monospace; font-size: 10px; color: #3a3c48; padding: 0 16px 12px; letter-spacing: 0.5px; }
      `}</style>

      {/* Nav */}
      <nav className="nav">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="logo-text" style={{ fontSize: 20, color: "#f0ece4" }}>Notae</span>
          <span className="tag">MVP</span>
        </div>
        <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: "#3a3c48", letterSpacing: "1px" }}>
          AI STUDY NOTE GENERATOR
        </span>
      </nav>

      <div className="main">
        {/* Hero */}
        <div className="hero">
          <h1>Turn transcripts into<br />structured study notes.</h1>
          <p>PASTE · UPLOAD · GENERATE · EXPORT TO NOTION OR OBSIDIAN</p>
        </div>

        <div className="grid">
          {/* Input Panel */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-label">Source Content</span>
              <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => fileRef.current?.click()}>
                ↑ Upload File
              </button>
              <input ref={fileRef} type="file" accept=".txt,.md,.mp4,.mp3,.m4a,.wav" style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])} />
            </div>

            <textarea
              className="textarea"
              placeholder="Paste your transcript, lecture notes, or raw text here…&#10;&#10;Works best with educational and technical content."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />

            <div
              className={`drop-zone ${dragOver ? "over" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
            >
              <p className="drop-text">Drop .txt or .md file here — or click to browse</p>
            </div>

            {error && <div className="error">⚠ {error}</div>}

            <div className="controls">
              <div className="ctrl-group">
                <span className="ctrl-label">Style</span>
                <div className="pill-group">
                  {STYLES.map(s => (
                    <button key={s.id} className={`pill ${style === s.id ? "active" : ""}`} onClick={() => setStyle(s.id)} title={s.desc}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ctrl-group">
                <span className="ctrl-label">Detail</span>
                <div className="pill-group">
                  {DETAILS.map(d => (
                    <button key={d.id} className={`pill ${detail === d.id ? "active" : ""}`} onClick={() => setDetail(d.id)}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" disabled={loading || !inputText.trim()} onClick={() => generate()}>
                {loading ? "Generating…" : "Generate Notes →"}
              </button>
            </div>

            <p className="input-hint">CHARACTER COUNT: {inputText.length.toLocaleString()} — Aim for 500+ chars for best results</p>
          </div>

          {/* Output Panel */}
          <div className="panel">
            <div className="panel-header" style={{ padding: 0, display: "block" }}>
              <div className="tabs">
                <button className={`tab-btn ${tab === "preview" ? "active" : ""}`} onClick={() => setTab("preview")}>Preview</button>
                <button className={`tab-btn ${tab === "edit" ? "active" : ""}`} onClick={() => setTab("edit")}>Edit</button>
              </div>
            </div>

            {loading ? (
              <div className="loading-wrap">
                <div className="spinner" />
                <span className="loading-text">GENERATING NOTES</span>
              </div>
            ) : output ? (
              <>
                {tab === "preview" ? (
                  <div className="md-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(editedOutput) }} />
                ) : (
                  <textarea
                    className="editor-ta"
                    value={editedOutput}
                    onChange={e => setEditedOutput(e.target.value)}
                    spellCheck={false}
                  />
                )}
                <div className="output-actions">
                  <button className="btn btn-ghost" onClick={copy}>{copied ? "✓ Copied!" : "Copy Markdown"}</button>
                  <button className="btn btn-ghost" onClick={download}>Download .md</button>
                </div>
                <div className="regen-bar">
                  <span className="regen-meta">
                    {editedOutput.split(/\s+/).filter(Boolean).length} WORDS · {style.toUpperCase()} · {detail.toUpperCase()}
                  </span>
                  <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={regenerate} disabled={loading}>
                    ↺ Regenerate
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📓</span>
                <span className="empty-text">NOTES WILL APPEAR HERE</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
