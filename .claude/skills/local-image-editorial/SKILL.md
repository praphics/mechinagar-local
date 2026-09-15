---
name: local-image-editorial
description: Decides what image, if any, belongs on a local-news article — approved library photograph first, category placeholder second, explicit AI illustration only as a deliberate last resort, or no suitable image at all. Generic across any local-information platform via a supplied city configuration and image library/manifest — never assumes a specific city, source, or filename. Never calls an image-generation API itself and never publishes an article.
---

# Local Image Editorial

This skill teaches Claude how to make (or explain) the image decision for
a local-information platform article — a site that publishes municipal,
community, and regional news for a specific place.

**This skill is city-agnostic by design.** It was written for a platform
covering one city, but nothing in this skill should hard-code that city's
name, image filenames, or landmarks. The approved image library, its
manifest, and the city configuration are supplied separately (see
"Reusability" below). If you find yourself about to write a specific city
name, a specific image filename, or a specific local landmark into this
file, stop — that belongs in the library/configuration, not here.

## Core principle

**A misleading image is worse than having no image.** Every rule below
exists in service of that. When in doubt between a plausible-but-uncertain
image and no image at all, choose no image. In priority order:

1. Topical accuracy — does the image actually relate to what the article
   is about?
2. Documentary honesty — does the image's type (photograph vs.
   illustration) match how it will be presented?
3. Image provenance — do we know where it came from and under what terms?
4. Editorial suitability — is it appropriate for a news context (no
   misleading composition, no embedded claims)?
5. Local relevance — does it help residents recognize the place/context?

Local relevance is last on purpose: it's a nice-to-have that can tip a
close call, never a substitute for the first three.

## What this skill does NOT do

- It does not call an image-generation API itself, under any
  circumstance. AI generation is only ever the outcome of an explicit,
  separate editorial decision — this skill can identify that AI
  illustration would be the appropriate next step, but the actual
  generation call happens through the project's own server-side/editorial
  generation workflow, invoked by a human, not by this skill.
- It does not publish an article or change its status. Image decisions
  and publishing are entirely separate actions.
- It does not remove or simplify away provenance information to make
  handling easier.
- It does not present an AI-generated illustration as evidence that a
  real event, person, location, or activity occurred.

## Image decision pipeline

For every article, work through this pipeline in order:

```
ARTICLE
 ↓
Check approved image library
 ↓
Is there a genuinely suitable image?
 ├── YES → use it
 │
 └── NO
       ↓
Does a category placeholder appropriately communicate
that this is a symbolic image?
 ├── YES → use placeholder
 │
 └── NO
       ↓
Is AI illustration explicitly permitted/requested?
 ├── NO → leave image decision unresolved
 │
 └── YES → AI-generated illustration workflow
```

Never skip a stage. In particular, never jump straight to AI illustration
because the library search felt inconclusive — confirm there's genuinely
no suitable library match and that a placeholder wouldn't serve just as
well, first.

## Approved library images

Only select an image that:

- is present in the approved image library (not merely downloaded or
  pending review — actually approved)
- has valid provenance metadata (see "Provenance" below)
- has an appropriate license/usage status for the intended use
- is topically relevant to the specific article (see "Topical matching")
- is not misleading in context

**Do not select an image simply because:**

- it is from the same city
- it has the same category
- it looks visually attractive
- it is the closest available image

**Category + locality alone is NOT sufficient** to justify using an image.
An image that merely shares a category with the article, or merely
depicts the same general place, but has no real topical connection to
what the article is actually about, is not a suitable match — treat that
case the same as having no library image at all.

## Topical matching

A strong match should be supported by meaningful topic evidence drawn
from:

- article tags
- article title
- article summary
- article topic keywords
- image tags
- image description

**Locality may strengthen a match. Locality must NOT replace topical
relevance.** A photograph of the right place but the wrong subject is
still the wrong image. If there is insufficient topical evidence linking
the image to the article's actual subject matter, the correct result is:

```
NO SUITABLE LIBRARY IMAGE
```

— not the closest, most-local, or most-recent image in the same category.
Falling back honestly to "no suitable image" is a correct, expected
outcome of this process, not a failure of it.

## Documentary photograph vs. AI illustration

Clearly distinguish these two image types and never blur them:

- **Photograph** = an actual photograph with documented provenance (a
  real camera, a real moment, a traceable source).
- **AI-generated illustration** = a synthetic visual created for
  illustration — it depicts no real, specific moment, regardless of how
  realistic it looks.

**Never present an AI illustration as evidence that a real event, person,
location, or activity occurred.** It illustrates a topic; it does not
document an occurrence.

## AI image rules

AI generation must be an explicit editorial decision — never automatic,
never inferred, never a silent fallback just because the library search
came up empty.

**This skill must NOT automatically call an image-generation API.** It
may conclude that AI illustration is the appropriate next step per the
pipeline above, and hand that conclusion to a human editor (or the
project's own explicit generation command), but it does not make the call
itself.

If generation is approved by an editor:

- Use a server-side/editorial generation workflow — never a client-side
  or publicly reachable call.
- Keep API credentials private — server-side environment configuration
  only, never exposed to client code, never committed to source control,
  never printed or logged.
- Save the generated image locally, under the project's own image
  storage convention.
- Record provenance for the generated image: when it was generated, which
  provider generated it, and which prompt version was used.
- Mark the image's type as AI-generated — never as a photograph.
- Provide visible disclosure (see "AI disclosure" below).
- Do not imply documentary authenticity anywhere in the image's metadata,
  caption, or surrounding article text.

### Prompt guidance

When a prompt is being built for AI illustration generation, it should
avoid:

- identifiable real people
- claims of depicting a specific real event
- fabricated government officials
- fake news photography (fake headlines, press-badge imagery, etc.)
- embedded text, unless specifically required for the use case
- named living artists' styles

Prefer clearly illustrative/editorial visual language — composition and
style that reads as an illustration, not as a photorealistic
documentary claim.

## AI disclosure

AI-generated images must be **visibly identified as such** wherever they
appear to a reader — not just in hidden metadata. Suitable wording may
include (adapt to the platform's configured language):

> "एआईद्वारा निर्मित प्रतीकात्मक तस्बिर"

or an equivalent disclosure appropriate to the site's language and voice.
**The exact UI implementation (where and how the disclosure is rendered)
belongs to the application, not this skill** — this skill's job is to
ensure the decision and the underlying data mark the image correctly so
that whatever UI the application has can surface it; it does not dictate
component-level implementation.

## Category placeholders

A category placeholder is an acceptable choice when:

- no suitable documentary photograph exists (per "Topical matching")
- the placeholder is clearly symbolic/generic, not staged to look like a
  real photo of the specific event
- the article does not require documentary evidence to be understood or
  trusted (most routine notices and announcements don't)

**Do not use a generic placeholder when it could misleadingly imply that
it depicts the actual event.** If a placeholder would plausibly be
mistaken for real documentary coverage of the specific story, that's a
sign AI illustration (with clear disclosure) or no image at all is more
honest than a placeholder.

## Provenance

For every library photograph, preserve:

- filename
- source
- source URL
- author/creator, when known
- license
- credit requirement (whether attribution is legally/contractually
  required)
- credit text (the exact attribution line to use, if required)
- usage (e.g. documentary vs. illustrative — whether the image genuinely
  depicts the real place/event, or is a generic stand-in)
- approval status

**Never remove provenance information simply to make image handling
easier.** If a workflow step doesn't need a particular provenance field,
that's fine — but the field itself must still exist and be preserved for
whatever step does need it (editorial review, attribution display, later
audits).

## Human review

Image selection — whether a library match, a placeholder, or an AI
illustration — remains subject to editorial review. This skill should
present its recommendation in a form that supports these editor actions:

- **APPROVE** — use the recommended image as-is
- **REJECT** — the recommendation is wrong; do not use it
- **REPLACE** — swap in a different specific image
- **REGENERATE** — (AI illustration only) try generation again, as a
  separate explicit action, not an automatic retry

**The final decision belongs to the editor**, not to this skill. This
skill's output is a recommendation with reasoning, not a final,
self-executing action.

## Article status

Image generation or selection must **never** publish an article, and must
never change `status: draft` to `status: published`. That is a wholly
separate editorial action, entirely outside this skill's scope, regardless
of how confident the image decision is.

## Reusability

To reuse this skill for a different local-information platform, do not
edit this file. Another city reuses it by providing:

- its own approved image library
- its own manifest (or equivalent metadata store)
- its own city configuration
- its own categories
- its own licensing/provenance information

**The image-decision methodology — the pipeline, the topical-matching
discipline, the documentary-vs-illustration distinction, the AI rules and
disclosure requirement, the provenance-preservation rule, and the
human-review requirement — remains unchanged.** Only the concrete image
library, manifest, categories, and licensing details differ between
cities.

## Output

When asked to make an image decision for an article, return:

```
Decision:
Use existing photograph / Use category placeholder /
AI illustration appropriate / No suitable image

Selected image:
<filename, or NONE>

Reason:
<why this decision — cite the specific topical/locality/provenance
evidence that led to it>

Provenance:
<the library image's provenance fields, if a library image was selected;
"N/A" if a placeholder or no image>

Disclosure required:
YES / NO

Human review:
REQUIRED

Article status:
UNCHANGED
```

`Article status` is always `UNCHANGED` — image decisions never alter it,
regardless of which of the four outcomes was chosen.
