---
name: local-fact-checker
description: Fact-checks a draft local-news article against its cited sources — identifies each factual claim, rates it VERIFIED/PARTIALLY VERIFIED/UNVERIFIED/CONFLICTING, and flags anything needing human editorial review. Generic across any local-information platform (municipality, metropolitan city, town, district, or community) via a supplied city configuration — never assumes a specific city. Produces an assessment only; never publishes, edits, or auto-corrects the article.
---

# Local Fact-Checker

This skill teaches Claude how to fact-check a draft article for a local-information
platform — a site that publishes municipal, community, and regional news for a
specific place (a municipality, metropolitan city, town, district, or local
community).

**This skill is city-agnostic by design.** It was written for a platform
covering one city, but nothing in this skill should hard-code that city's
name, sources, or terminology. Every city-specific detail is supplied
separately as a **city configuration** (see "Local configuration" below). If
you find yourself about to write a specific city name, source name, or
government office into this file, stop — that belongs in the city
configuration, not here.

## What this skill does NOT do

- It does not publish, edit, or move an article's `status`.
- It does not invent, complete, or strengthen a claim beyond what the
  evidence actually supports.
- It does not call any external API, browse the web on its own initiative,
  or fetch anything not explicitly provided by the user/editor.
- It does not replace an editor's judgment — it produces an assessment
  *for* editorial review, not a publishing decision.

## Local configuration

Before fact-checking, this skill expects (or asks for) a **city
configuration** describing the specific platform it's being used for. This
is supplied by the calling context (the user, a project's `CLAUDE.md`, or a
config file), not hard-coded here. A city configuration typically includes:

- City / municipality / metropolitan-city name
- The governing authority (e.g. municipality office, metropolitan city
  office, district administration office, ward offices)
- District and province (or equivalent administrative units)
- A list of official/primary sources for that place (government offices,
  official notice boards, the municipality's own website or social
  channels, named local institutions)
- Preferred language(s) for the platform (e.g. Nepali-first, bilingual)
- Local terminology conventions (e.g. how wards, notices, or offices are
  named locally)

If no city configuration is available when this skill is invoked, ask for
one, or ask the user to confirm which sources should be treated as
official/primary for this run, rather than guessing.

### Example: two cities, one methodology

**City A**
- Official source: City A Municipality Office notices
- Secondary sources: City A's district administration office, named local
  government agencies

**City B**
- Official source: City B Metropolitan City Office notices
- Secondary sources: a different district administration office, different
  named local agencies

The fact-checking *methodology* below — claim extraction, source priority,
status/confidence rating, the no-invention rule — is identical for both.
Only the configuration changes. A future city C reuses this skill by
supplying its own configuration; the skill file itself does not change.

## Source priority (general — override per city configuration)

When a city configuration supplies its own source hierarchy, use that
instead. Absent a more specific hierarchy, use this general priority order,
highest first:

1. Primary official source (the institution the claim is actually about,
   speaking for itself — e.g. the municipality's own notice, a signed
   official letter, an official press release)
2. Official document or notice (a published circular, gazette entry, notice
   board posting, or similar formal document)
3. Government agency (a relevant government office or agency that is not
   the primary subject but has direct authority over the matter)
4. Direct institutional source (a named organization directly involved —
   a school, hospital, cooperative, club — speaking about its own affairs)
5. Reputable secondary reporting (an established news outlet reporting on,
   but not itself party to, the event)
6. Other sources (social media posts, unverified tips, word of mouth,
   anonymous or unnamed sources)

A claim's source tier directly informs its status and confidence rating
below — a claim resting only on tier 5–6 sources should rarely be rated
higher than PARTIALLY VERIFIED, no matter how plausible it sounds.

## Web-source vs. supplied-PDF evidence

Evidence reaching this skill comes in two distinct forms — always keep
them distinguishable in the assessment, never blur them into one
undifferentiated "source":

- **Web-source evidence** — a page fetched directly (a notice page, a
  news article) during research. Cite it the way this skill already does:
  by source name and URL.
- **Supplied-PDF evidence** — a document a human editor injected through
  `.claude/evidence/` (see that directory's `README.md` and
  `scripts/ingest-evidence.ts`). Each ingested document produces an
  **evidence record** (`.claude/evidence/processed/<evidence-id>/record.json`)
  with an `extractionStatus` of either `"extracted"` or
  `"requires-human-review"`.

**A supplied PDF may strengthen or establish a claim only when its
evidence record's `extractionStatus` is `"extracted"`** — i.e. the
relevant information was actually machine-readable and is present in that
record's extracted text. A record with `extractionStatus:
"requires-human-review"` (the document was scanned/illegible and no OCR
was available or successful) must be treated **exactly like an unreadable
scanned attachment** (see step 6 below) — UNVERIFIED, flagged for a human
to actually open the original — never treated as if it had been read.

When a claim is supported by supplied-PDF evidence, cite the **Evidence
ID** (e.g. `ev-3f9a1c2b8e77`) in the claim's `Source` field alongside the
document description, so the claim stays traceable: Evidence ID →
document (`processed/<id>/original.pdf`) → extraction method → extracted
text. Never cite "the attached PDF" without its Evidence ID once one
exists.

## Fact-checking process

Work through a draft article claim by claim, not as a single pass over the
whole text:

1. **Identify individual factual claims.** Break the article into discrete,
   checkable factual statements (a date, a quantity, a decision, an event,
   a quoted statement, a cause-and-effect assertion). Opinion, framing, and
   editorializing are not factual claims — skip them.
2. **Identify the source supporting each claim.** For every claim, find
   what in the provided source material actually supports it — a specific
   sentence, document, or quote. If nothing in the provided material
   supports a claim, say so explicitly; do not search for supporting
   evidence outside what was given unless asked to.
3. **Apply source priority.** Rank the strength of the supporting source
   using the hierarchy above (or the city configuration's hierarchy).
4. **Distinguish an official announcement from a confirmed real-world
   outcome.** These are not the same claim. "The municipality announced it
   will distribute machines" is verifiable from an official notice alone.
   "The municipality distributed machines" requires evidence the
   distribution actually happened, not just that it was announced or
   planned. Do not let an announcement quietly become an outcome.
5. **Preserve dates exactly when they matter.** Do not round, approximate,
   translate between calendar systems, or paraphrase a date away when the
   claim's accuracy depends on that specific date. If a source gives a date
   in one calendar system (e.g. Bikram Sambat) and the article uses another
   (e.g. Gregorian), flag the conversion for human confirmation rather than
   silently converting it yourself.
6. **Flag unclear scanned attachments.** If a source is an image, scan, or
   PDF that is illegible, partially cut off, low-resolution, or otherwise
   not confidently readable, do not guess at its content. State plainly
   that the attachment could not be reliably read and that a human should
   review the original — and, if it hasn't been already, that the original
   can be supplied through `.claude/evidence/` (see "Web-source vs.
   supplied-PDF evidence" above) so it can actually be processed rather
   than staying an open gap.
7. **Never fill missing information with guesses.** If the source material
   doesn't state a number, name, date, or outcome, do not supply one —
   not even a "reasonable" or "likely" one. A gap in the evidence is a gap
   in the article's claim, not something for this skill to complete.
8. **Preserve uncertainty.** Where evidence is incomplete, ambiguous, or
   only partially confirms a claim, the assessment should say so plainly
   rather than resolving the ambiguity in either direction.
9. **Note conflicts.** If two sources disagree on the same claim (a
   different number, date, or account of what happened), report both and
   mark the claim CONFLICTING — do not silently pick the source that seems
   more credible and drop the other.
10. **Flag what needs a human.** Anything genuinely ambiguous, high-stakes
    (numbers, official decisions, anything naming a specific person),
    dependent on an unclear attachment, or resting only on weak sources
    should be explicitly flagged for editorial review, even if you'd
    otherwise be inclined to rate it VERIFIED.

## The no-invention rule

State this rule explicitly in every fact-check assessment:

> **If the available evidence does not support a claim, do not strengthen,
> complete, or invent the claim.**

Example of what this rule forbids:

- Source says: *"An attachment is available."*
- **Wrong**: "The municipality will distribute 500 agricultural machines."
  (invents a quantity, an item, and an outcome the source never stated)
- **Right**: "The article references an attachment describing a
  distribution plan; the attachment's contents were not provided/legible,
  so the specific quantity and item cannot be verified from what's
  available. Flag for editor to review the original attachment."

This applies just as much to plausible-sounding inferences as to obviously
fabricated ones. "The municipality probably means X" is still inventing
content the source didn't provide.

## Output format

For each claim, produce a structured entry using this exact shape:

```
Claim: <the specific factual claim, stated plainly>
Source: <what source material was checked against this claim>
Evidence: <what the source actually says — quote or closely paraphrase it>
Status: VERIFIED | PARTIALLY VERIFIED | UNVERIFIED | CONFLICTING
Confidence: <High | Medium | Low, with a one-phrase reason>
Notes: <anything else relevant — ambiguity, a conflict between sources,
  an unclear attachment, a date needing confirmation, or an explicit flag
  for human/editor review>
```

### Status definitions

- **VERIFIED** — a primary/official source directly and unambiguously
  supports the claim as stated, including its specifics (numbers, dates,
  names).
- **PARTIALLY VERIFIED** — the general thrust of the claim is supported,
  but some specific detail (a number, a date, a name, an outcome vs. an
  announcement) is not confirmed by the available source material.
- **UNVERIFIED** — no source material provided supports the claim, or the
  only supporting material is too weak/unclear (e.g. an illegible
  attachment, a tier-6 source) to say either way.
- **CONFLICTING** — two or more sources disagree on the claim; report what
  each one says rather than picking a winner.

End every assessment with a short summary line stating how many claims were
found and how many fall into each status, and an explicit note that this is
an assessment for editorial review, not a publishing decision — the article
remains exactly as it was (typically `status: draft`) regardless of the
outcome.

## Reusing this skill for another city

To reuse this skill for a different local-information platform:

1. Do not edit this file.
2. Supply that platform's own city configuration (name, governing
   authority, district/province, official sources, source hierarchy,
   language conventions) through whatever mechanism the calling project
   uses (its own `CLAUDE.md`, a config file, or directly in the request).
3. Everything in "Fact-checking process," "The no-invention rule," and
   "Output format" above applies unchanged — only the source list and
   hierarchy differ between cities.

If a future need genuinely requires different fact-checking *behavior*
(not just different sources) for a specific platform, that belongs in that
platform's own project-level instructions or a project-specific skill that
extends this one — not as a hard-coded special case inside this file.
