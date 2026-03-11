# MVP Technical Spec

## 1. Architecture (Lean)

- **Client (Web UI)**
  - Input forms for text/file/media
  - Style and detail selectors
  - Split-screen editor (source + markdown)
  - Regenerate and export actions
- **API Layer**
  - `/api/transcribe` for media transcription
  - `/api/generate` for note generation
- **AI Services**
  - Transcription model (e.g., Whisper)
  - LLM generation model using fixed prompt + section schema

## 2. Data Flow

1. User submits source content.
2. If media: transcribe and normalize transcript text.
3. Build generation request with:
   - transcript text
   - note style
   - detail level
   - optional user instructions
4. Send to LLM with strict markdown section requirements.
5. Render markdown output and allow edits.
6. Optional regenerate using cached source transcript.

## 3. API Contracts (Proposed)

## `POST /api/transcribe`

**Request**

- `multipart/form-data`
  - `media`: file
  - `language` (optional)

**Response**

```json
{
  "transcript": "...",
  "durationSeconds": 1234,
  "segments": []
}
```

## `POST /api/generate`

**Request**

```json
{
  "sourceText": "...",
  "style": "concise|concept|review",
  "detailLevel": "short|medium|deep",
  "audience": "student|technical|certification",
  "focusHints": ["optional", "topics"],
  "includeKnowledgeCheck": true
}
```

**Response**

```json
{
  "markdown": "# Title\n...",
  "meta": {
    "style": "concept",
    "detailLevel": "medium",
    "wordCount": 950
  }
}
```

## 4. Markdown Schema Contract

Expected section order:

1. `# Topic Title`
2. `## Overview`
3. `## Key Concepts`
4. `## Important Terms`
5. `## Explanations`
6. `## Real-World Use Cases`
7. `## Knowledge Check`
8. `## Key Takeaways`

Notes:
- All headings should be present unless source lacks supporting content.
- Use bullet lists for scanability.
- Keep paragraph size compact.

## 5. Prompting Strategy

- System prompt enforces:
  - technical accuracy
  - concept-first structure
  - concise educational style
  - anti-filler constraints
- Inject style and detail profile via small prompt variables.
- Add fallback handling for low-quality transcripts.

## 6. Error Handling

- Unsupported file type: return 415 + accepted types.
- Transcription failure: show retry path and preserve upload state.
- LLM timeout: return partial/fallback summary when available.
- Empty output: auto-retry once with simplified schema.

## 7. Performance Targets

- Text/file input to note: < 30s p50
- Media input to final note: < 90s p50 (depends on length)
- Max media length in MVP: configurable (e.g., 90 minutes)

## 8. Security & Privacy (MVP)

- Use signed upload URLs or direct backend upload with size limits.
- Strip metadata not required for generation.
- Avoid long-term storage by default; ephemeral session cache first.
- Basic abuse guardrails: file size and request rate caps.

## 9. QA Checklist

- Verify each input path end-to-end.
- Verify each style/detail combination.
- Verify markdown validity and heading presence.
- Verify regeneration uses same source context.
- Verify copy/export roundtrip into Notion/Obsidian.
