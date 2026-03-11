# MVP Product Spec

## 1. Product Summary

The Note Taking App turns educational video transcripts, uploaded media, or raw text into high-quality Markdown study notes. It is intentionally optimized for learners who care about understanding and recall rather than generic summarization.

## 2. Target User

- Students preparing for exams or classes
- Technical learners following tutorials/courses
- Certification candidates
- Knowledge workers learning from webinars/talks

## 3. Core User Problem

Raw transcripts are noisy and hard to review. Generic summarizers often skip definitions, structure, and practical context. Users need study notes that can be reused later in Notion/Obsidian.

## 4. User Jobs-to-be-Done

1. Capture content from a learning source quickly.
2. Convert it into structured, clean study notes.
3. Review/edit only lightly (not rewrite from scratch).
4. Export/copy to their existing PKM tools.

## 5. MVP Workflow

1. User provides source content (text/file/media).
2. User selects note style + detail level.
3. System transcribes when needed.
4. AI generates structured Markdown note.
5. User reviews in split-screen editor.
6. User copies/exports result.
7. Optional: user regenerates same source with different style.

## 6. Core MVP Features

### Input

- Paste transcript text
- Upload transcript file (.txt, .md)
- Upload video/audio for auto-transcription

### Generation

- Structured Markdown output with stable section schema
- Selectable note style:
  - Concise Study Notes
  - Concept-Focused Technical Notes
  - Quick Review Notes
- Selectable detail level (short/medium/deep)
- Regeneration from same source context

### Output / Editing

- Split-screen: source content + generated Markdown
- Lightweight editor for post-editing
- Copy Markdown and download `.md`

## 7. Output Quality Bar

- Emphasize conceptual correctness over verbosity
- Define terms clearly and consistently
- Preserve critical caveats/limitations
- Include practical use cases/examples
- Include short knowledge-check prompts
- Avoid filler and repetitive phrasing

## 8. Non-Goals (MVP)

- Team/collaboration features
- Multi-document knowledge graph
- Full quiz/flashcard platform
- Complex Notion/Obsidian integrations
- Workspace/user permissions layer

## 9. MVP Acceptance Criteria

- All 3 input types function end-to-end.
- Generated notes follow markdown schema in at least 95% of generations.
- Median generation time is acceptable for single input (< 30s with transcript, < 90s including transcription).
- Users can regenerate output in different style without re-uploading.
- Export/copy behavior is reliable across modern browsers.

## 10. Future Extensions

- YouTube URL ingestion
- Saved note history + tags
- Auto glossary and flashcards
- Timestamp links to source media
- Multi-source synthesis on same topic
- Personalized templates
