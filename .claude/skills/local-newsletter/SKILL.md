---
name: local-newsletter
description: Turns today's (or a given date's) published local articles into a concise, trustworthy Nepali-first Markdown newsletter draft, plus an editorial selection summary explaining what was included and why. Generic across any local-information platform via a supplied city configuration — never assumes a specific city or branding. Never sends email, never calls Beehiiv or any external API, never publishes anything; output is always a draft for human review.
---

# Local Newsletter

This skill teaches Claude how to turn a local-information platform's
published articles into a newsletter draft — a site that publishes
municipal, community, and regional news for a specific place.

**This skill is city-agnostic by design.** It was written for a platform
covering one city, but nothing in this skill should hard-code that city's
name or branding. The city name, language preference, and branding come
from a **city configuration** supplied separately (see "Reusability"
below). If you find yourself about to write a specific city name into this
file, stop — that belongs in the configuration, not here.

This project already has a concrete, working implementation of this
methodology (`scripts/build-newsletter.ts`, producing
`content/newsletters/YYYY-MM-DD.md` drafts) — treat that as the reference
example of "what this looks like when built," not as something this skill
needs to duplicate. A different project reusing this skill will have its
own equivalent generation mechanism, or none yet; either way, the
methodology below is what matters, not any particular script.

## What this skill does NOT do

- It does not send an email, call Beehiiv, or call any other external
  API.
- It does not publish a newsletter or an article, and does not change any
  article's `status`.
- It does not introduce new factual claims beyond what published articles
  already state.
- It does not invent stories, upcoming events, or short updates to hit a
  target count.

## Input

This skill expects:

- published local articles (only — see "Source: published only")
- city configuration (name, preferred language, branding — see
  "Reusability")
- today's date (or a specified target date)
- the platform's existing article categories
- article summaries
- reading-time information, where available

### Source: published only

**Only published articles should normally be included. Draft articles
must never appear in the newsletter.** If an article's status is anything
other than published, it does not exist for the purposes of this skill,
full stop — there is no exception for "important" or "almost ready"
drafts.

## Newsletter principles

The newsletter should be useful, concise, trustworthy, Nepali-first (or
per the city configuration), locally relevant, and easy to scan. Avoid
clickbait, exaggerated urgency, sensational headlines, unnecessary
repetition, and invented information. These principles override "filling
out" the newsletter to look fuller than the day's actual published news
supports — a short, honest newsletter is correct output, not a failure.

## Structure

Generate:

```
# [City] Local Daily

<Date>

<Short introduction — one or two sentences>

## आजका मुख्य समाचार

<approximately 3–6 important stories, each with:
  - headline
  - one-sentence summary
  - category
  - reading time, when available>
```

`[City]` comes from the city configuration's name — never hard-code a
specific city's name into the template itself.

## Story selection

Prioritize stories by usefulness to residents, not by how attention-
grabbing they are. Consider:

- public notices
- deadlines
- government services
- transport/border information
- education
- agriculture
- business
- employment
- community information
- environment
- public-interest developments

**Do not select stories simply because they are sensational.** Select
approximately 3–6 stories. **If fewer than 3 suitable stories exist, use
fewer — never invent stories to fill a target number.** A newsletter with
one genuine story is correct; a newsletter with three genuine stories and
two padded-out ones is not.

## Short updates

Add:

```
## छोटकरीमा

<3–5 short bullet updates>
```

...only **when enough additional published information exists** beyond
the main stories. Do not repeat the main stories here unnecessarily —
this section is for genuinely additional items, not a second pass over
the same headlines. **If there are no suitable additional updates, omit
this section** rather than padding it with restatements or filler
bullets.

## Today's local briefing

Where the platform provides an existing "Today's [City]"-style daily
briefing feature (a homepage section, a daily digest, or similar) built
from the same verified published articles, this skill should draw on that
same underlying information rather than re-deriving it independently.
**Do not independently invent a second version of the news** that could
drift from what the platform's own briefing already says — both should
trace back to the same published articles and the same facts.

## Tomorrow

Add:

```
## भोलिको झलक

<a genuinely useful preview of upcoming information>
```

...**only when there is genuinely useful upcoming information** to share
(a scheduled event, an upcoming deadline, a known future notice). **Do not
invent future events.** If there is nothing useful to preview, omit the
section entirely — a placeholder teaser with no real content behind it is
still a form of invented information.

## Language

Default: **Nepali-first**, per the city configuration. English may remain
for technical terms, proper names, official terminology, and URLs/
metadata. **Do not automatically create bilingual newsletters** — follow
the platform's language convention for a single newsletter rather than
duplicating content in two languages by default.

## Source integrity

The newsletter must use only information contained in published articles
and their verified source material — **do not introduce new factual
claims** that aren't already in the article being summarized. **If an
article contains an uncertainty (a qualified or partially-verified
detail), do not silently remove that uncertainty when summarizing it for
the newsletter.** A one-sentence digest version of a claim should carry
the same level of confidence as the article it's drawn from, not a more
confident-sounding compressed version.

## No duplication

If multiple published articles describe the same event:

- avoid repeating the same information across multiple newsletter entries
- prefer the most complete/current published article as the one to
  feature
- **do not merge facts from multiple articles in a way that creates an
  unsupported claim** that neither article actually states on its own

## Output

This skill should be capable of producing two things:

1. **Newsletter Markdown**, in the structure above.
2. **An editorial selection summary**, in this shape:

```
Selected stories:
...

Omitted stories:
...

Reason for selection:
...

Potential issues:
...
```

`Omitted stories` should name any published article from the relevant
date/period that was considered but not included, and why (not
sufficiently useful, duplicate of a selected story, etc.) — this is what
lets an editor sanity-check that nothing important was silently dropped.
`Potential issues` should surface anything worth a human's attention:
an uncertain detail carried over from a source article, a close call on
story selection, a section that was omitted for lack of content, etc.

## Draft only

Generated newsletters are always drafts. This skill must **never**:

- send an email
- publish a newsletter
- call Beehiiv
- change any article's status
- publish website content

**Human review is required before distribution.** This skill's output is
something an editor reads, edits if needed, and manually sends through
whatever distribution channel the platform actually uses — it is not a
send action.

## Reusability

To reuse this skill for a different local-information platform, do not
edit this file. Another city reuses it by providing:

- city name (for the `[City] Local Daily` title and introduction)
- preferred language
- branding
- its own published articles
- its own categories
- its own local configuration (deadlines/services relevant to that
  place, its own "today's briefing" feature if it has one, etc.)

**The newsletter methodology — published-only sourcing, usefulness-based
story selection with no invented padding, the honest-omission rules for
the short-updates and tomorrow sections, source-integrity/no-new-claims
discipline, no-duplication handling, the draft-only output with an
editorial selection summary, and the total absence of any send/publish
action — remains unchanged.** Only the branding, language default,
article set, and configuration differ between cities.
