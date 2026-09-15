---
name: local-article-attachment
description: Attaches a manually-reviewed PDF (an official notice, etc.) to a published or draft article so readers can download it from the article page. Use this whenever the editor has a PDF they've already confirmed is safe to publish and wants it linked from a specific article. Never use this to publish anything from .claude/evidence/ without an explicit fresh confirmation that this specific file has been reviewed for personal information.
---

# Attaching a reviewed PDF to an article

This skill wires a single PDF attachment onto one article. It assumes the
human editor has ALREADY manually reviewed the specific PDF and confirmed
it contains no personal information (names, citizenship numbers, addresses,
phone numbers) — this skill never makes that judgment call itself, and
never pulls a file from .claude/evidence/ automatically, even if it looks
safe at a glance.

## Before running

Ask for, if not already given:
- The article's slug (matches a file in content/articles/<slug>.md).
- The full path to the reviewed PDF on this machine.
- The link label to show readers (e.g. "सडक स्तरोन्नति सूचना (PDF)").

If any of these three is missing, ask for it rather than guessing.

## Steps

1. Confirm src/lib/types.ts already defines ArticleAttachment and that
   content/articles.ts parses an optional `attachment` frontmatter field.
   If this schema doesn't exist yet, stop and tell the editor — build the
   schema first rather than adding a frontmatter field nothing will read.
2. Confirm content/articles/<slug>.md exists. If not, stop and ask.
3. Copy (never move) the given PDF into public/documents/, named
   <slug>-notice.pdf unless that collides with an existing file, in which
   case pick a clear, non-colliding name and say so.
4. Open content/articles/<slug>.md and add an `attachment` block to its
   frontmatter immediately after `featuredImage` (or at the end of the
   frontmatter if there's no featuredImage), with:
     attachment:
       src: /documents/<filename>
       label: "<the given label>"
   matching the file's existing YAML indentation and quoting style exactly.
   Don't touch anything else in the file.
5. Show the diff (the new file under public/documents/ and the frontmatter
   change) before committing anything to git.

## What this skill never does

- Never decides on its own that a PDF is safe to publish — that's always
  the human's call, made before this skill is invoked.
- Never reads from or references .claude/evidence/ — that store is private
  and structurally separate from anything public.
- Never attaches more than one PDF per invocation, and never touches an
  article's body text, images, or any other frontmatter field.
