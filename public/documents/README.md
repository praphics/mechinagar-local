# Public documents

This folder holds official document attachments (currently: PDFs) that are
served **publicly**, directly, at `/documents/<filename>` — anything placed
here is reachable by anyone, with no gate, no review step, and no login,
the moment it's deployed.

## Before a file goes in here

**Every file in this folder must already have been manually reviewed by a
human editor and confirmed to contain no personal information** — no
names, citizenship numbers, addresses, phone numbers, or anything else a
resident wouldn't expect to see published under their own name. That
review happens entirely outside this repository, before the file is ever
placed here. Nothing in this codebase performs that review, decides that a
document is safe, or should be trusted to make that call.

## Never automated

- **Nothing writes to this folder automatically.** No script in this repo
  copies, generates, or downloads a file into `public/documents/`.
- **In particular, no script may ever copy a file from `.claude/evidence/`
  into this folder.** `.claude/evidence/` exists specifically to hold
  *unreviewed* source PDFs (see its own `README.md`) — often the exact
  scanned government notices that can carry citizenship numbers and
  addresses. Evidence PDFs are deliberately gitignored and never served by
  the running site (see that folder's "Security" section); moving one here
  would defeat that entirely. The two folders must never be bridged by
  code — only by a human, after review, placing a separate, reviewed copy.
- A file only ever ends up here because a human editor put it here
  directly, having already confirmed it's safe to publish.

## How an article links to a document here

An article's frontmatter may set an optional `attachment` field:

```yaml
attachment:
  src: /documents/mechinagar-mun-property-tax-notice-2083.pdf
  label: "सम्पत्ति कर सूचना (PDF)"
```

`src/lib/content/articles.ts` requires `src` to start with `/documents/`
and end in `.pdf`, and requires `label` to be a non-empty string — but it
never inspects the file itself. Adding the frontmatter and adding the
reviewed file to this folder are both required, and both are manual, human
steps.
