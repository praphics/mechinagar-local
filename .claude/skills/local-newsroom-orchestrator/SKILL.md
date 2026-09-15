---
name: local-newsroom-orchestrator
description: Runs the full local-information editorial pipeline end to end — reads the city configuration, then invokes local-news-research, local-fact-checker, local-article-writer, and local-image-editorial in sequence, producing a single editorial package for human review. Generic across any local-information platform via .claude/city-config.json — never hard-codes a city. Human-review-only in this version — never publishes, never sends a newsletter, never calls an image-generation API, never overwrites an existing article.
---

# Local Newsroom Orchestrator

This skill runs the other five reusable skills in sequence — it does not
duplicate their methodology, and it does not bypass any of them. Its job
is coordination: read the city configuration once, hand the right input
to each skill in the right order, and assemble their outputs into one
editorial package a human can review.

**This skill is city-agnostic by design.** It reads
`.claude/city-config.json` for every city-specific value it needs
(identity, language, sources, categories, image/newsletter configuration)
and never hard-codes a city name, source, or URL itself. See
"Reusability" below for how a second city reuses this exact skill.

## What this skill does NOT do

This is a **human-review-only** orchestrator. It must never automatically:

- publish an article
- change `status: draft` to `status: published`
- send a newsletter
- call Beehiiv
- generate an AI image
- spend money on any image API

**AI image generation may only be recommended as a decision** — see Stage
5. It must never:

- invent facts, sources, or URLs
- modify an existing, already-published article
- overwrite an existing article file (see Stage 4's slug-collision rule)
- automatically approve an image recommendation

It is not exposed as a public API route, and it never handles or embeds
API keys — image-provider credentials, if a human later acts on an AI-
illustration recommendation, live only in `.env.local` per
`src/lib/ai-image/config.ts`'s existing pattern; this skill never touches
them.

## Input

Accept either:

- **A specific topic/article request** — e.g. "Research this specific
  notice: ...", or a request naming a particular event, article slug, or
  subject.
- **A request to discover new local stories** — e.g. "Research today's
  important local news," "Find new government notices," "Research
  agriculture news."

Either way, the pipeline below runs the same; only what's fed into Stage
2 (a specific topic vs. an open-ended discovery brief) differs.

## Pipeline

```
STAGE 1  City config
  ↓
STAGE 2  Research           (local-news-research)
  ↓
STAGE 3  Fact-check         (local-fact-checker)
  ↓
STAGE 4  Article writer     (local-article-writer)   ← slug-collision gate
  ↓
STAGE 5  Image editorial    (local-image-editorial)  ← recommendation only
  ↓
STAGE 6  Final editorial package
```

### Stage 1 — City config

Read `.claude/city-config.json` (or the equivalent file for whichever
city this orchestrator is running for — see "Reusability"). Use it for:

- city identity (name, municipality, district, province, language)
- the source hierarchy and sector-grouped source list
- article categories (via the config's `articleCategories.ref`, which
  points at the project's real category list — do not hard-code
  categories here either)
- image configuration (library/manifest/placeholder locations)
- newsletter configuration (not used by this pipeline directly, but
  available if a later stage needs the newsletter name/language)

**Do not hard-code city-specific values anywhere else in this skill or in
the pipeline's reasoning** — if a value isn't in the config and isn't in
the research material gathered in Stage 2, treat it as unknown rather
than assuming it.

### Stage 2 — Research

Hand the request (specific topic or discovery brief) to
`.claude/skills/local-news-research/SKILL.md`, using Stage 1's source
list and source-priority hierarchy. Follow that skill's full workflow
(source discovery → reading → fact extraction → source recording →
importance assessment) and produce its documented output format:
candidate stories, each with sources, dates, key facts, attachments,
uncertainties, and a potential article angle.

Do not skip straight to writing prose here — Stage 2's job is structured
research records, not a draft.

### Stage 3 — Fact-check

Pass each candidate story's research output to
`.claude/skills/local-fact-checker/SKILL.md`. For each one:

- verify claims against their cited sources
- identify unsupported claims
- preserve uncertainties rather than resolving them either way
- distinguish an announcement from a confirmed outcome
- identify missing or illegible attachments

**Reject a candidate story at this stage** — do not carry it forward to
Stage 4 — when there is no genuinely verifiable core fact to report: every
claim is UNVERIFIED with no usable source, or the central claim is
CONFLICTING in a way that can't be reported honestly (see
`local-fact-checker/SKILL.md`'s CONFLICTING status). A story with
PARTIALLY VERIFIED claims is not automatically rejected — it proceeds to
Stage 4, where those claims must be qualified in the prose rather than
stated as settled fact (this is the normal, expected case for most local
notices, not a failure state).

### Stage 4 — Article writer

For each story that passed Stage 3, pass **only** the research and
fact-check outputs — nothing else — to
`.claude/skills/local-article-writer/SKILL.md`, along with Stage 1's
config (for the frontmatter schema reference, language default, and
category list).

**Slug-collision gate — check before writing anything:** determine the
article's slug and check whether it already exists in the project's
article content directory (per Stage 1's config —
`content/articles/` in this project; grep for the slug, since a slug
does not have to equal its filename). **Never overwrite an existing
article.** If the slug already exists:

> STOP. Do not generate a draft for this slug. Report that an existing
> article at that slug already exists and requires human review instead.

Only when the slug is confirmed new does article writing proceed. Every
article this stage produces must contain `status: draft` — never
anything else — regardless of how well-verified its facts are.

### Stage 5 — Image editorial

For any article Stage 4 actually produced, pass it to
`.claude/skills/local-image-editorial/SKILL.md` using Stage 1's image
configuration (library/manifest/placeholder locations). Get back one of:
an approved library image, a category placeholder, "AI illustration
appropriate," or "no suitable image."

**Do not generate an image at this stage, or any stage.** Record the
recommendation only — an "AI illustration appropriate" result is a
recommendation for a human to act on separately (e.g. by running the
project's own explicit generation command), never something this
orchestrator triggers itself.

### Stage 6 — Final editorial package

Assemble everything into a single package, in this shape:

```
ARTICLE
-------

Title: <headline>
Slug: <slug>
Category: <category>
Status: draft

<the full Markdown article draft from Stage 4>


FACT-CHECK
----------

Claim summary: <how many claims, and the breakdown by status>
Verified: <list, or "none">
Unverified: <list, or "none">
Uncertainties: <the qualifications carried into the draft>


IMAGE
-----

Decision: <Use existing photograph / Use category placeholder /
  AI illustration appropriate / No suitable image>
Selected image: <filename, or NONE>
Reason: <from local-image-editorial's output>
Provenance: <from local-image-editorial's output, or "N/A">
Disclosure required: YES / NO


SOURCES
-------

<every source actually used across research and fact-check, listed
plainly — never a source that wasn't actually consulted>


EDITORIAL FLAGS
---------------

<anything requiring human attention: uncertain claims, an unclear
attachment, a close call on story selection, a slug collision that
halted Stage 4, an image decision that needs a human APPROVE/REJECT/
REPLACE/REGENERATE call, or anything else worth a second look>
```

If Stage 4 halted on a slug collision, Stage 6 still produces a package —
just one reporting the halt (Stages 2–3's output, plus an explicit note
that no draft was generated and the existing article needs human review)
rather than a full `ARTICLE` section.

## Files

This orchestrator is a skill (this file), not a script or application
route — that's deliberate. Every stage after Stage 1 requires editorial
judgment (research relevance, fact-check confidence, prose writing, image
suitability), which is Claude's job to reason through per the referenced
skills, not something a deterministic Node script could carry out. Stage
1 (reading a JSON config file) and the Stage 4 slug-collision check are
the only genuinely mechanical steps, and both are simple enough to do
directly with ordinary file-reading tools — they don't need a dedicated
script.

**This skill is never exposed as a public API route**, and it never
contains or reads an API key itself — see "What this skill does NOT do."

## Reusability

To run this same orchestrator for a different local-information platform,
change only:

- `.claude/city-config.json` (that city's own identity, sources,
  categories, image/newsletter configuration)
- that city's own content directory, image library/manifest, and source
  material that the config points at

**The five underlying skills, and this orchestrator skill itself, remain
unchanged.** Nothing in this file should ever need to change to support a
new city — if it does, that's a sign a city-specific value leaked into
this file instead of into the config.

## Safety summary

The orchestrator must never: invent facts, invent sources, invent URLs,
publish anything, modify an already-published article, overwrite an
existing article file, automatically approve an image recommendation,
automatically generate a paid image, or send a newsletter. Every one of
these is enforced by the underlying skill for that stage (see each
`SKILL.md`'s own "What this skill does NOT do" section) — this
orchestrator does not weaken or bypass any of them by chaining the stages
together.
