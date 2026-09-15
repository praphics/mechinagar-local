# Attaching a reviewed PDF to an article

Use this whenever you have an official notice (or similar document) you've
manually reviewed and want readers to be able to download from an article
page. This is separate from `.claude/evidence/` — that store is private and
never reaches the public site; this is for a file you've deliberately
decided is safe to publish.

## Before you do this

Confirm the specific PDF has no personal information in it (names,
citizenship numbers, addresses, phone numbers). This is a manual judgment
call every time — never skip it, and never reuse a file straight out of
`.claude/evidence/` without this review, even if it looks fine at a glance.

## How to invoke it

1. Open Command Prompt or Anaconda Prompt.
2. `cd E:\Mechinagar-Local`
3. Type `claude` and press Enter to start Claude Code in this folder (or
   just reuse an already-open Claude Code session in this project).
4. Paste the template below with the three blanks filled in, then press
   Enter.

## The template

```
Attach a reviewed PDF to an existing article.

Article slug: <e.g. mechinagar-mun-road-upgrade-ward-6>
PDF file (already manually reviewed by me, confirmed to contain no
personal information): <full path to the PDF on this computer>
Link label to show readers: <e.g. "सडक स्तरोन्नति सूचना (PDF)">

Do this:
1. Copy (don't move) that PDF into public/documents/, naming it
   <slug>-notice.pdf (or a similarly clear name if that collides).
2. Open content/articles/<slug>.md and add an `attachment` block to its
   frontmatter, right after featuredImage, with `src: /documents/<filename>`
   and `label: "<the label above>"` — same indentation and quoting style as
   the existing featuredImage block. Don't touch anything else in the file.
3. Confirm the attachment schema/parsing change (ArticleAttachment in
   src/lib/types.ts) already exists before doing this — if it doesn't yet,
   stop and tell me instead of adding a frontmatter field nothing will read.
4. Show me the diff (both the new file being added and the frontmatter
   change) before committing anything.
```

Fill in the slug, the PDF's path, and the label text each time — everything
else in the template stays the same.
