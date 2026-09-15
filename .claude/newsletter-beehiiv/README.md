# Beehiiv draft integration — idempotency state

`state.json` maps a newsletter's date to the Beehiiv draft it produced, so
re-running `npm run newsletter:draft` for the same date doesn't create a
duplicate draft in Beehiiv. See `scripts/newsletter-beehiiv-draft.ts` for
the actual integration.

## What this is NOT

This is not a substitute for the article `status` field or
`.claude/newsroom/state.json`'s workflow states — a Beehiiv draft's
existence has no bearing on any article's `draft`/`published` status.
Only `scripts/newsletter-beehiiv-draft.ts` ever **writes** this file; the
`/newsroom` dashboard (`src/lib/newsroom/beehiivReview.ts`, added in
Phase 8) **reads** it to display the Beehiiv panel, and never writes to it.

## Schema

```json
{
  "drafts": {
    "2026-08-16": {
      "newsletterFile": "content/newsletters/2026-08-16.md",
      "beehiivDraftId": "post_...",
      "createdAt": "2026-08-16T12:00:00.000Z",
      "verifiedStatus": "draft",
      "verifiedAt": "2026-08-16T12:01:00.000Z",
      "previewUrl": "https://app.beehiiv.com/posts/post_.../preview"
    }
  }
}
```

`verifiedStatus`/`verifiedAt`/`previewUrl` come from an explicit
follow-up GET, not the create response — Beehiiv's own docs note the
create response can return before the post has finished being created,
which this script confirmed firsthand (an initial run reported
`verifiedStatus` as unavailable before this refresh step existed). These
fields are optional in the type — an entry from before this refresh
existed, or one created with a transient verification failure, simply
won't have them yet.

## Idempotency

Before calling Beehiiv, `scripts/newsletter-beehiiv-draft.ts` checks this
file for an existing entry for the target date. If one exists, it reports
the existing draft ID and does **not** call Beehiiv again — a second
identical invocation is always safe. Instead, if credentials are
available, it does a **read-only** refresh of that existing draft's
verification (GET only, never touches the draft itself) and updates this
file's cached `verifiedStatus`/`verifiedAt`/`previewUrl`. `--force`
bypasses the idempotency check entirely and creates a new draft anyway
(still `status: "draft"`, never sent) — use only when you actually want a
second Beehiiv draft for the same date (e.g. after a correction).

## Non-secret

This file never contains the Beehiiv API key — only the publication's own
draft-post IDs, which are not secrets (they identify content that exists
in your own Beehiiv account, not credentials to access it). The API key
lives only in `.env.local` as `BEEHIIV_API_KEY` — see
`scripts/newsletter-beehiiv-draft.ts`'s header comment.
