---
name: local-article-writer
description: Turns verified local research and a fact-check assessment into a concise, trustworthy Markdown article draft for a local-information platform, using the project's existing article frontmatter schema. Generic across any local-information platform (municipality, metropolitan city, town, district, or community) via a supplied city configuration — never assumes a specific city or invents facts beyond its source material. Always outputs status: draft; never publishes, deploys, or sends a newsletter.
---

# Local Article Writer

This skill teaches Claude how to turn verified local research into an
article draft for a local-information platform — a site that publishes
municipal, community, and regional news for a specific place.

**This skill is city-agnostic by design.** It was written for a platform
covering one city, but nothing in this skill should hard-code that city's
name, sources, or institutions. Every city-specific detail comes from a
**city configuration** and the research/fact-check input it's given (see
"Input" and "Local configuration" below). If you find yourself about to
write a specific city name, source, or institution into this file, stop —
that belongs in the configuration/input, not here.

The article *schema* (frontmatter fields, status values, image-type enum)
is different: that's a property of the software project this skill runs
inside of, not of any particular city, so it's described concretely below
against this project's actual schema (see "Frontmatter"). A copy of this
skill running inside a different project should follow *that* project's
actual schema instead — never invent one.

## What this skill does NOT do

- It does not publish an article, change `status` from `draft`, deploy
  anything, or send a newsletter. Publishing is a separate, human-approved
  step, always.
- It does not add facts from general knowledge, its own assumptions, or
  anything not present in the research/fact-check input.
- It does not automatically generate an image.
- It does not invent a new frontmatter schema — it follows the project's
  actual one.

## Workflow

```
RESEARCH → FACT-CHECK → ARTICLE STRUCTURE → WRITE →
EDITORIAL SELF-CHECK → DRAFT
```

## Input

Before writing, this skill expects:

1. **Research output** from `.claude/skills/local-news-research/SKILL.md`
   (or equivalent research material in that shape).
2. **Fact-check assessment** from
   `.claude/skills/local-fact-checker/SKILL.md` — the `Claim / Source /
   Evidence / Status / Confidence / Notes` records for the facts involved.
3. **City configuration** (see "Local configuration" below).
4. **The existing project's article schema/frontmatter** (see
   "Frontmatter" below) — read the actual schema from the project rather
   than assuming it matches what's documented here, if the two ever
   diverge.

If any of these is missing — especially the fact-check assessment — ask
for it, or clearly mark the draft as not yet fact-checked, rather than
writing as if verification had happened.

## Source of truth

The fact-check and research material is the source of truth for
everything in the draft. **Do not silently add facts from general
knowledge.** Do not invent:

- names
- quotes
- statistics
- dates
- locations
- outcomes
- public reactions
- motives
- causes

If a detail is uncertain per the fact-check assessment (PARTIALLY
VERIFIED, UNVERIFIED, or CONFLICTING), either qualify it clearly in the
prose ("अनुसार भनिएको छ", "अझै पुष्टि हुन बाँकी छ", or equivalent for the
configured language) or omit it entirely. Never state an unverified detail
as plain fact.

## Article types

Support the common shapes a local-information platform publishes:
government notices, municipal announcements, public services, community
news, education, agriculture, business, employment, environment,
transport/border information, and events. Treat this list as illustrative,
not exhaustive — **the actual category set is configurable** and should
come from the city configuration or the project's existing category list,
not be redefined here.

## Language

Default: **Nepali-first**, unless the city configuration specifies
otherwise. English may be used where it's the natural choice — technical
terms, proper names, official terminology, URLs, and metadata fields — but
**do not automatically produce a bilingual article**. Write one article in
one primary language per the configuration/project convention; if the
project supports separate-language articles as distinct entries (rather
than one bilingual article), treat language selection as a per-article
decision, not something this skill defaults to duplicating.

## Headline

Headlines must be accurate, concise, descriptive, and useful to a resident
skimming a list of stories. Avoid clickbait, exaggerated urgency,
unsupported claims, and sensational language. **Do not make the headline
stronger than the evidence** — if the fact-check assessment only supports
"announced," the headline may not say "will," and it certainly may not say
it already happened.

## Article structure

When appropriate, structure the article as:

1. Headline
2. Short summary
3. What happened
4. Important details
5. What residents need to know/do
6. Source/context

**Do not force every section when the story doesn't need it.** A short
notice doesn't need a "what residents need to know" section if there's
nothing residents need to do; don't pad it with filler to hit a template.

## Government notices

For official notices, clearly distinguish:

- what the authority announced
- when it was announced
- what residents need to know
- deadlines/requirements, only if verified by the fact-check assessment
- where the original notice can be accessed

**Do not turn an announcement into a completed outcome.** "The office
announced an extended service window" and "the office extended its
service window" are different claims — write the one the fact-check
assessment actually supports.

## Attachments

If the research/fact-check input says an attachment exists but its
contents could not be reliably read, say so plainly in the article rather
than guessing at what it contains. For example (adapt to the configured
language):

> सूचनासँग संलग्न कागजात रहेको देखिए पनि उपलब्ध प्रतिलिपिबाट विवरण स्पष्ट
> रूपमा पढ्न सकिएन।

Do not invent the attachment's contents under any circumstance, even if a
plausible guess seems likely to be correct.

**Never treat an `EVIDENCE REQUIRED` block (from `local-news-research`) or
a `PDF EVIDENCE REQUIRED` report entry (from `local-news`'s daily
workflow) as verified information.** Those are requests for a document,
not the document's contents — writing as if the request itself confirmed
something is exactly the invention this rule forbids. A supplied-PDF
evidence record only becomes usable once
`local-fact-checker/SKILL.md`'s "Web-source vs. supplied-PDF evidence"
section has actually assessed it — check its `extractionStatus` was
`"extracted"` before treating any detail from it as available; if it's
`"requires-human-review"`, write the same as any other unread attachment
above. When a detail *does* come from successfully-extracted PDF
evidence, cite its Evidence ID (e.g. `ev-3f9a1c2b8e77`) in the article's
source/context section, the same way the fact-check assessment does, so
the claim stays traceable back to the original document. If evidence is
missing either way, either omit the unsupported detail or explicitly
state that the document could not be read — never one that implies it
was.

## Attribution

Preserve source attribution from the research/fact-check input. When
information comes from an official source, make that explicit in the
article's "Source/context" section or equivalent. Include the original
source URL in the frontmatter's source-URL field where the project schema
supports it (see "Frontmatter").

## Frontmatter

Follow the existing project's article schema — **do not invent a new
one**. In this project (see `src/lib/types.ts`'s `Article`/`ArticleImage`
types and `content/articles/*.md` for real examples), the schema is:

```yaml
title: "..."            # headline (authoring key "title" → runtime "headline")
slug: article-slug
category: category-slug  # must be a value from the project's category list
language: ne | en
summary: "..."           # one short sentence/blurb
author: "..."
publishedAt: "..."       # ISO 8601 — leave unset/placeholder in a draft
updatedAt: null
source: "..." | null
sourceUrl: "..." | null
tags: []
featured: false
status: draft             # ALWAYS draft — see "Status" below
featuredImage:             # or null — see "Image" below
  src: /images/...
  alt: "..."
  caption: "..."           # optional
  type: photograph | illustration | ai-generated-illustration | placeholder
  usage: illustrative | documentary
```

If the project this skill is running inside of has a different schema,
read that project's actual schema and follow it instead — never assume
this exact shape carries over unchanged.

## Status

Every newly generated article must default to `status: draft`. This
skill must **never**:

- publish (change `draft` to `published`)
- deploy
- send a newsletter

Publishing is a separate, human-approved step, entirely outside this
skill's scope.

## Image

**Do not automatically generate an image.** Use the project's existing
image/editorial workflow instead of inventing one here. In this project,
that workflow's priority order is: an approved library photograph →
(rarely) an approved library illustration → an explicitly, separately
requested AI-generated illustration → a category placeholder — and AI
generation only ever happens via an explicit, separate editorial command
(in this project, `npm run generate:image -- <slug>`), never as a side
effect of writing an article.

If no suitable image has already been resolved by that workflow, **leave
the image decision unresolved** in the draft (e.g. `featuredImage: null`,
or note "IMAGE: Needs decision" in the editorial check below) rather than
inventing or assuming documentary imagery exists.

## Editorial self-check

Before producing the draft, check:

1. Is every factual claim supported by the fact-check assessment?
2. Is the headline supported by the evidence — no stronger?
3. Are dates accurate and preserved exactly as sourced?
4. Are names accurate as given in the source material?
5. Are numbers supported by the source material?
6. Are uncertain details clearly qualified (or omitted)?
7. Is source attribution present?
8. Is the language Nepali-first (or per the configuration)?
9. Is the article actually useful to local residents?
10. Is there any invented information anywhere in the draft?
11. Could any sentence misleadingly imply an event happened when the
    source only shows it was announced, scheduled, or planned?

If any check fails, fix the draft before presenting it — don't present a
draft you know fails its own self-check and flag it as a caveat instead.

## Output

Produce two things:

1. **The complete Markdown article draft**, using the project's existing
   frontmatter/schema (see "Frontmatter").
2. **A short editorial check**, in this shape:

```
FACTUAL CLAIMS:
SUPPORTED / NEEDS REVIEW

UNCERTAINTIES:
...

SOURCE:
...

IMAGE:
Existing / Placeholder / Needs decision

STATUS:
draft
```

## Reusing this skill for another city

To reuse this skill for a different local-information platform, do not
edit this file. Only the following should change between cities:

- city configuration (name, authority, district, province, sources)
- the source/research input fed to this skill
- local terminology
- categories, where the target platform's category list differs
- branding

**The writing methodology — source-of-truth discipline, the no-invention
rule, the announcement-vs-outcome distinction, the editorial self-check,
and the output format — remains the same.** The article *schema*
("Frontmatter" above) and the image workflow it defers to are properties
of the software project this skill runs inside of, not of the city; a copy
of this skill running in a different project should read and follow that
project's actual schema/workflow instead of this project's.
