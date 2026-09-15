---
name: local-library-image-import
description: Adds a new photo to the approved image library from a single URL — fetches it, looks at it, infers category/filename/tags/description, and finds real license and attribution info, then registers it via scripts/download-library-image.ts. Use whenever the editor gives one image URL or source page URL and wants it added to the library. Never invents a license — stops and asks if the source's license can't be confirmed. Never marks an image approved; that stays a separate manual step.
---

# Adding a library image from just a URL

This skill turns "here's a URL, add it to the library" into a full
scripts/download-library-image.ts invocation, by doing the parameter-guessing
work a human would otherwise do by hand: category, filename, tags,
description, and — most carefully — license and attribution.

## Before running

Ask for, if not already given:
- The URL. This can be a direct image link (ends in .jpg/.png/etc.) or a
  source page (a Wikimedia Commons file page, a Pexels/Unsplash/Pixabay photo
  page, a government or news site).

That should be the only required input — everything else below is inferred,
with one exception: if the license can't be confirmed, this skill stops and
asks rather than guessing (see step 3).

## Steps

1. Resolve the actual image. If the URL is a direct image file, use it as-is
   for both download and inspection. If it's a page (Commons, Pexels,
   Unsplash, Pixabay, a news article, a government site), fetch the page and
   find: (a) the actual full-resolution image file URL, (b) the license
   statement, (c) the photographer/author name, and (d) the page itself as
   sourceUrl — never lose the page link, since that's what lets a human
   verify the license later.

2. Look at the image. Fetch or download it and actually look at what's in
   it — this drives every other guess below. Don't skip this even when the
   filename or page title makes the subject seem obvious.

3. Determine the license — the one place this skill refuses to guess.
   - Known-good sources make this easy: Wikimedia Commons file pages state
     the license in a standardized box; Pexels and Pixabay content is under
     their respective free licenses (use the exact license name as stated on
     their site, e.g. "Pexels License"); Unsplash has the Unsplash License.
     Government/municipality sites vary — look for an explicit statement
     (public domain notice, government-work notice) rather than assuming one.
   - If you cannot find an explicit, checkable license statement on the
     source page — or the URL is just a bare image link with no page
     attached — STOP. Tell the editor exactly what you found and didn't
     find, and ask them to either supply the license themselves or point you
     to the page that states it. Do not proceed to step 5 with a guessed or
     "probably fine" license. This mirrors the one hard gate
     download-library-image.ts itself enforces (--license is mandatory, no
     exceptions) — the whole point is that nobody downstream re-checks it.

4. Infer category, filename, tags, description.
   - Category: pick the single best match from kakarvitta-border, government,
     agriculture, business, community, infrastructure, education,
     environment, general — based on what's actually in the image (step 2),
     not the source page's own categorization.
   - Filename: a short, descriptive, kebab-case name ending in the correct
     extension, e.g. mechinagar-rice-field-harvest.jpg. Check it won't
     collide with an existing file in that category folder; if it would, add
     a distinguishing suffix.
   - Tags: 3-6 concrete nouns describing what's in the image (subject,
     setting, activity) — these feed the site's own image-matching engine, so
     specific beats generic ("rice-harvest", "farmer", "paddy-field" beats
     just "agriculture").
   - Description: one plain sentence describing what the image shows.
   - Usage: default to "illustrative" unless you can independently verify
     (from the source page) that it's a real photo of the actual local place
     or event — only then use "documentary". When genuinely unsure, use
     "illustrative".

5. Run the script with everything gathered:

   npm run library:download -- --url "<direct image URL>" --category <category> --filename <filename> --source "<site name>" --sourceUrl "<the page URL from step 1>" --license "<exact license text>" --author "<photographer, if known>" --description "<description>" --tags "<tag1,tag2,tag3>" --usage <illustrative|documentary> [--creditRequired --creditText "<exact credit line>" if the license requires attribution]

   Report the script's own output verbatim — it already confirms the saved
   path and manifest entry.

6. Remind, every time: the image is saved with approved: false. Nothing
   changes that automatically. The editor still needs to review it in
   /review/images (or by hand-editing manifest.json) before it's eligible for
   use on the site.

## What this skill never does

- Never fabricates or assumes a license when the source doesn't state one
  clearly — asks instead.
- Never sets approved: true — that stays the editor's own deliberate step,
  exactly as the script enforces.
- Never adds an image without a working sourceUrl a human could actually
  visit to double-check the license later.
- Never claims "documentary" usage on a guess — only when the source page
  itself supports it.
