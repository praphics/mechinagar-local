# Newsroom workflow state

`state.json` in this directory tracks the **newsroom workflow state** of
each story `/local-news` discovers — separate from, and never a
replacement for, the real article `status` field (`draft`/`published`) in
`content/articles/*.md`. See
`.claude/skills/local-news/SKILL.md`'s "Approval, review, and publication"
section for the full editorial workflow this backs.

## Why a state file, not a database

Inspected the existing project first, per the task that built this: the
project already uses small local JSON files for exactly this kind of
structured, low-volume, single-editor state (`manifest.json` for the
image library, `city-config.json` for city configuration, evidence
records under `.claude/evidence/processed/`). A newsroom's daily story
count is small and there's one editor, not concurrent multi-user access —
a database would solve a scaling/concurrency problem this project doesn't
have. A single JSON file, read and rewritten atomically by
`scripts/newsroom-action.ts`, is the simplest implementation that's
actually safe for this use case.

## Workflow states

```
DISCOVERED → FACT_CHECKED → DRAFT_READY → APPROVED → PUBLISHED
                                        ↘ REJECTED
                (any stage) ↘ BLOCKED (unresolved evidence requirement)
```

These are **newsroom workflow states**, tracked only in `state.json`.
They are never written into article frontmatter, and the article schema
was not changed to accommodate them (`src/lib/types.ts` is untouched) —
per the "keep workflow state separate from article frontmatter unless
there is a compelling reason to change the schema" rule this system was
built under. The actual article `status` field only ever has two values,
`draft` and `published`, exactly as before.

## Why this is a script, not just conversational judgment

`scripts/newsroom-action.ts`'s `approve`/`reject`/`publish` verbs
mechanically enforce every safety gate (article exists, status is still
`draft`, fact-check passed, no blocking evidence, image decision exists,
no unresolved safety issue) rather than relying on remembering to check
each one in conversation every time. `publish` is the only verb that ever
writes to `content/articles/*.md`, and it only ever flips one line
(`status: draft` → `status: published`) on the single article it was
explicitly told to publish, after every gate above passed.

## Stale-report protection

Every time `/local-news` runs, it starts a fresh report (`start-report`)
with a new `reportId` and records each story under that ID. `approve N` /
`reject N` / `publish N` resolve position `N` against the report
**currently on record** — if a story's own record still points at an
older `reportId` than the current report (meaning a newer report was
generated since), resolution refuses and asks for the report to be
re-run or the exact slug to be given directly instead of guessing which
story "1" is supposed to mean now.

## Persistence format

```json
{
  "currentReport": {
    "reportId": "rep-...",
    "date": "2026-08-16",
    "generatedAt": "ISO timestamp",
    "items": [{ "position": 1, "slug": "...", "title": "..." }]
  },
  "stories": {
    "<slug>": {
      "workflowState": "DRAFT_READY",
      "reportId": "rep-...",
      "factCheckPassed": true,
      "factCheckSummary": "...",
      "imageDecision": "...",
      "evidenceRequired": false,
      "evidenceIds": [],
      "safetyIssues": [],
      "approvedAt": null,
      "rejectedAt": null,
      "rejectionReason": null,
      "publishedAt": null,
      "history": [{ "at": "ISO", "event": "recorded", "note": "..." }]
    }
  }
}
```

This file is not git-ignored (unlike `.claude/evidence/`) — it holds no
personal information, only editorial workflow metadata about this
project's own articles, which is reasonable to keep in version history.

## Linking evidence to a story

`evidenceRequired` (above) is only ever a boolean — it says a story is
blocked on unresolved evidence, but on its own gives an editor no way to
actually open the document from the dashboard. `evidenceIds` closes that
gap: a list of evidence IDs (see `.claude/evidence/README.md` and
`scripts/ingest-evidence.ts`) linked to this specific story, so
`/newsroom/[slug]` (dev-only) can show a direct link to each PDF next to
its provenance (source URL, document type, ingestion date, and whether it
came back `requires-human-review`).

Link an already-ingested document to a story with:

```bash
node --experimental-strip-types scripts/newsroom-action.ts link-evidence <slug> <evidenceId>
```

This is deliberately a separate step from ingestion — `ingest-evidence.ts`
has no notion of newsroom stories or slugs at all (see its own header
comment), and `link-evidence` has no notion of PDF extraction; each script
does exactly one job. `link-evidence` only ever appends to `evidenceIds`
and records a `history` entry — it never touches `evidenceRequired` or
`workflowState`. Whether a linked document actually *resolves* a blocking
evidence requirement is an editorial judgment (the PDF might turn out to
be unreadable too), so that stays a separate, explicit decision — e.g.
re-running `record ... --state FACT_CHECKED` once the requirement is
genuinely resolved.

Records written before this field existed simply have no `evidenceIds`
key; both `scripts/newsroom-action.ts` and `src/lib/newsroom/state.ts`
normalize that to `[]` on read, so nothing breaks against older state
files.
