---
name: local-news-research
description: Researches local information for a local-information platform — discovers and reads sources, extracts facts with their sources intact, assesses resident-relevant importance, and hands off a structured research record for fact-checking. Generic across any local-information platform (municipality, metropolitan city, town, district, or community) via a supplied city configuration — never assumes a specific city. Never writes the final article and never publishes anything.
---

# Local News Research

This skill teaches Claude how to research local information for a
local-information platform — a site that publishes municipal, community,
and regional news for a specific place. It covers finding and reading
sources, pulling out facts without losing where they came from, and
judging what's actually useful to residents.

**This skill is city-agnostic by design.** It was written for a platform
covering one city, but nothing in this skill should hard-code that city's
name, government offices, institutions, or URLs. Every city-specific detail
comes from a **city configuration** supplied separately (see "Local
configuration" below). If you find yourself about to write a specific city
name, a specific municipal website, or a specific local institution into
this file, stop — that belongs in the city configuration, not here.

## What this skill does NOT do

- It does not write the final article. Research output is raw material for
  a writer, not a draft.
- It does not fact-check in depth — see "Fact-check handoff" below for how
  it hands off to `.claude/skills/local-fact-checker/SKILL.md` instead of
  duplicating that methodology.
- It does not publish anything, change any article's status, send a
  newsletter, or call an image-generation API.
- It does not invent anything the sources didn't actually say.

## The research workflow

Work through these stages in order for each research task:

```
SOURCE DISCOVERY → SOURCE READING → FACT EXTRACTION →
SOURCE RECORDING → IMPORTANCE ASSESSMENT → FACT-CHECK HANDOFF
```

### 1. Source discovery

Identify where to look, using the city configuration's official source list
first. Prefer sources in this order (use the city configuration's own
hierarchy instead if it supplies one):

1. Official municipal/metropolitan sources (the governing authority's own
   website, notice board, or official channel)
2. Government agencies (district administration, relevant government
   offices with authority over the matter)
3. Official notices and documents (circulars, gazette entries, published
   notices)
4. Official institutional sources (a named school, hospital, cooperative,
   or similar body speaking about its own affairs)
5. Reputable local/secondary reporting (established local or regional news
   outlets reporting on, but not party to, the matter)
6. Other sources — only when appropriate, and always flagged as weaker

**Never treat a source as authoritative merely because it appears high in
search results.** Ranking in a search engine is not the same as being an
official or primary source — judge a source by what it actually is (see
the hierarchy above), not by how it was found.

### 2. Source reading

Read the source material directly rather than relying on a summary,
headline, or search snippet. If a source references an attachment (a PDF,
scanned notice, or image), see "Attachments" below before treating its
contents as known.

### 3. Fact extraction

Pull out discrete factual items: what happened or was announced, who is
involved, what numbers or dates matter, what deadline applies, where it
took place. Keep each fact tied to the specific source sentence or document
it came from — extraction that loses this link is not usable research (see
"Source recording").

### 4. Source recording

Every factual item intended for later article writing must retain its
source. **Never produce research where the source has been lost** — if
you can't say where a fact came from, either find that link again or mark
the fact as unsourced/unusable rather than passing it along unattributed.

### 5. Importance assessment

Judge whether an item is likely useful to local residents. Consider:

- immediate public relevance
- deadlines
- government notices
- services
- transport/border information
- education
- agriculture
- employment
- business
- community events
- environment
- public safety

**Do not use clickbait or sensationalism as an importance criterion.**
"Would this genuinely help or inform a resident of this place" is the
question — not "would this get clicks."

### 6. Fact-check handoff

Package the research output so it's ready for
`.claude/skills/local-fact-checker/SKILL.md` to verify. **Do not duplicate
that skill's fact-checking methodology here** — this skill's job is to
clearly identify *which* facts still need verification (see "Uncertainties"
in the output format below), not to verify them itself.

## Announcement vs. event

Clearly distinguish these at extraction time — they are not
interchangeable, and research output must preserve the distinction rather
than flattening it into a single "it happened" statement:

- an authority **announcing** something (stating an intention or plan)
- an application or notice being **published** (a document existing and
  being made available)
- an event being **scheduled** (a planned future occurrence)
- an event **actually occurring** (a confirmed past or in-progress
  outcome)
- a decision being **implemented** (a policy or plan actually carried out,
  not just decided on)

**Never convert one into another.** "The municipality announced a plan to
repair the road" and "the municipality repaired the road" are different
facts requiring different evidence — record exactly which one the source
actually supports.

## Attachments

If an official page references a PDF, scanned notice, image, or other
attachment:

- Record that the attachment exists, even if you can't inspect it.
- Inspect it when accessible.
- Distinguish readable from unreadable information — if part of an
  attachment is legible and part isn't, say which is which.
- **Never invent information that cannot be read.** An illegible or
  inaccessible attachment is a gap in the research, not something to fill
  in with a plausible guess.
- Record the attachment's URL when available, so it can be reached again
  later (by an editor, the fact-checker, or a future research pass).

### Evidence requests

When an attachment can't be reliably read (illegible, low-resolution, a
scanned image with no extractable text, or simply inaccessible from
here), produce an explicit **evidence request** alongside the research
record — don't just note the gap in "Uncertainties" and move on:

```
EVIDENCE REQUIRED
Source: <the source/institution the attachment belongs to>
Attachment: <what it is and where it's referenced/linked>
Reason: <why it couldn't be read — illegible scan, no extractable text,
  inaccessible, etc.>
Claims blocked: <which specific facts can't be verified without it>
Suggested action: Supply the original PDF via .claude/evidence/incoming/
  and run `npm run evidence:ingest -- <filename> --source "..."` (see
  .claude/evidence/README.md) — then re-run fact-checking against the
  resulting evidence record.
```

This is what `.claude/skills/local-news/SKILL.md`'s daily workflow uses
to decide whether to hold a story open (pending evidence) instead of
silently discarding it — see that skill's "PDF EVIDENCE REQUIRED"
handling. An evidence request is not itself evidence, and information may
only enter fact-checking once the requested document has actually been
supplied and processed through `.claude/evidence/` — see
`local-fact-checker/SKILL.md`'s "Web-source vs. supplied-PDF evidence."

## Research output format

For every useful item, record:

```
Title: <a short, plain description of the item — not a finished headline>
Source: <the source name/institution>
Source URL: <link, if available>
Published/notice date: <when the source material was published or posted>
Information date: <when the event/fact itself occurred or takes effect —
  may differ from the publish date>
Category: <a topic category — use the city configuration's local
  categories if it supplies any, otherwise a plain descriptive label>
Key facts: <the discrete factual items extracted from this source>
People/organizations mentioned: <names as given in the source>
Location: <as stated in the source — do not infer a more specific
  location than the source actually gives>
Important numbers: <quantities, amounts, statistics — exactly as sourced>
Important deadlines: <dates by which residents must act, if any>
Attachments: <what attachments exist, their URLs if available, and
  whether their contents were readable — see "Attachments" above>
Uncertainties: <anything unclear, unconfirmed, single-sourced, or
  otherwise needing verification — this is the field that feeds the
  fact-check handoff>
Potential article angle: <a brief, non-committal note on why this might
  be worth writing up — not a drafted headline or lede>
```

## Editorial rules

- **Nepali-first, unless the city configuration specifies otherwise.**
  Follow whatever language convention the configuration provides; default
  to Nepali-first only in its absence.
- **Do not invent** quotes, statistics, dates, names, locations, outcomes,
  or public reactions. If a source doesn't state something, the research
  record doesn't state it either.
- **If information is missing, record it as missing** — explicitly, in
  the relevant field (usually "Uncertainties") — rather than leaving a
  gap that looks like an oversight or quietly working around it.

## Local configuration

Before researching, this skill expects (or asks for) a **city
configuration** — supplied by the calling context (the user, a project's
`CLAUDE.md`, or a config file), not hard-coded here. A city configuration
typically includes:

- City name
- Municipality/metropolitan authority
- District
- Province
- Official websites
- Government sources
- Local institutions
- Preferred language
- Local categories

If no city configuration is available when this skill is invoked, ask for
one — including at minimum an official source list — rather than guessing
at what counts as authoritative for that place.

### Reusing this skill for another city

To reuse this skill for a different local-information platform, do not
edit this file — supply that platform's own city configuration through
whatever mechanism the calling project uses. The workflow, source-priority
reasoning, attachment handling, announcement-vs-event distinction, output
format, and editorial rules above apply unchanged; only the concrete
source list, categories, and language default differ between cities.

## No automatic publishing

This skill only researches. It must never:

- publish an article
- change an article's status
- send a newsletter
- call an image-generation API

Research output is raw material for a human editor (or a separate writing
step) to turn into a draft — this skill's job ends at the fact-check
handoff, not at a finished or published article.
