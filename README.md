# Note Taking App (MVP)

AI-powered note generation for students and self-learners working from long educational videos, transcripts, and technical tutorials.

## MVP Goal

Convert messy learning content into clean, reusable Markdown notes suitable for Notion and Obsidian, with a clear study structure and technical accuracy.

## Scope (v1)

- Single-document note generation workflow
- Inputs:
  - Pasted transcript text
  - Uploaded transcript file
  - Uploaded video/audio file (auto transcription)
- Structured Markdown output
- Style selection (concise, concept-focused, quick review)
- Regenerate with different style/detail from same source
- Split-screen review editor and export-ready Markdown

See detailed plans in:

- `docs/mvp-product-spec.md`
- `docs/mvp-technical-spec.md`
- `docs/note-markdown-template.md`
- `prompts/note-generation-system-prompt.md`

## Out of Scope (v1)

- Team collaboration / multi-user permissions
- Shared workspaces/libraries
- Full PKM suite features (semantic search, graph, etc.)
- Flashcards/quizzes beyond lightweight knowledge checks
- Advanced integrations (Notion API sync, Obsidian vault sync)

## Suggested Stack (pragmatic)

- Frontend: Next.js + TypeScript + Tailwind
- Backend API: Next.js route handlers or lightweight Node service
- AI provider: OpenAI-compatible API
- Transcription: Whisper API (or equivalent)
- Storage (optional for v1): local/session-based first, DB later

## Definition of MVP Success

1. User can submit one source input and receive a structured Markdown note within acceptable latency.
2. Generated notes are consistently formatted and easy to copy into Notion/Obsidian.
3. Notes include concept clarity, terminology, practical use cases, and short review prompts.
4. User can regenerate in another style without resubmitting source content.
