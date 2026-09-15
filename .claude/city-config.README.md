# City configuration

`.claude/city-config.json` is the concrete, Mechinagar-specific data that
the five reusable Skills under `.claude/skills/` (`local-news-research`,
`local-fact-checker`, `local-article-writer`, `local-image-editorial`,
`local-newsletter`) are designed to receive rather than have hard-coded
into them. This document explains the file's fields, where the values
came from, and how another city reuses the same five Skills by supplying
its own copy of this file.

This is infrastructure/configuration only. It does not change any
existing article, image, the manifest, any Skill, or `package.json`, and
it is not wired into the Skills automatically by this change — "the Skills
should eventually be able to use this configuration" (per the task that
created it), not "the Skills now read this file automatically."

## What belongs in city configuration vs. what belongs in the Skills

This is the boundary every one of the five `SKILL.md` files already
documents in its own "Local configuration" / "Reusability" section — this
file is the first concrete instance of that boundary being filled in.

**Belongs in city configuration** (this file, or a future city's own copy
of it):
- The city's name, governing authority, district, province, country,
  and primary language.
- Editorial preferences: preferred language, local terminology, the
  newsletter's name and language, approximate story counts.
- The list of official/government/institutional/community sources for
  this specific place, grouped by sector, with URLs and priority.
- Pointers to where this project's image library, manifest, category
  placeholders, and article content actually live — not the content
  itself, just where to find it.

**Belongs in the Skills** (`.claude/skills/*/SKILL.md` — never
duplicated here):
- The fact-checking methodology (claim extraction, status/confidence
  rating, the no-invention rule).
- The research workflow (source discovery → reading → extraction →
  recording → importance assessment → fact-check handoff).
- The writing methodology (source-of-truth discipline, headline
  restraint, the announcement-vs-outcome distinction, the editorial
  self-check).
- The image-decision pipeline and its documentary-vs-AI-illustration
  rules.
- The newsletter-generation structure and its honest-omission rules.

In short: **the Skills describe *how* to do the work; this file describes
*where* and *for whom*.** A Skill file should never contain a specific
city name, source, or URL; this file should never contain fact-checking
or writing methodology.

## Field-by-field explanation

### `cityIdentity`
City name, municipality, district, province, country, and primary
language, each with `ne`/`en` variants where the project uses both. These
are the same values already used throughout this project's own docs and
code (see "Existing project values reused" below) — nothing here was
invented.

`localityTerms` — a flat array (mixed English/Nepali, matched case-
insensitively) of place names this city's approved image library should
get a relevance bonus for genuinely depicting — read by
`src/lib/library/match.ts` (via `src/lib/cityConfig.ts`'s
`getLocalityTerms()`) and mirrored in `scripts/generate-image.ts`'s own
config reader. **This is the one field the image matcher actually
consumes at runtime** — everything else in `cityIdentity` is descriptive/
for the Skills. Added in Milestone 6E.1 specifically to remove a prior
hard-coded dependency (`src/lib/library/match.ts` used to hard-code these
same term values as a module constant, unreachable by any config). A
second city populates this with its own place names; an empty or missing
list is always safe — it just means the locality bonus never fires,
never that another city's terms leak in.

### `editorial`
- `preferredLanguage` — matches this project's Nepali-first convention
  (see `src/lib/types.ts`'s `Language` type and the site's actual article
  mix).
- `localTerminology` — a short list of terms already used in this
  project's real article bodies and `SOURCES.md` (ward, municipality,
  tole development organization, district administration office, customs
  office, immigration office), so a Skill has a starting vocabulary
  without needing to guess local phrasing.
- `articleCategories` — deliberately **not** a duplicated list. It points
  at `src/lib/data/categories.ts`, the project's one real category list,
  per the "do not create a second competing schema" rule.
- `newsletterName` / `newsletterLanguage` — the newsletter title actually
  used by `scripts/build-newsletter.ts`'s output ("Mechinagar Local
  Daily"), plus a Nepali rendering.

### `sources`
Grouped exactly as requested: `municipality`, `government`, `education`,
`agriculture`, `health`, `transport`, `business`, `community`,
`environment`, `other`. Each group is `{ sources: [...], status: "..." }`
— `status` says plainly whether the group was populated from existing
project material or is empty and needs configuration, so it's never
ambiguous whether an empty group is "confirmed there are none" vs.
"nobody has looked yet" (it's always the latter).

Each source entry carries `name`, `url` (or `null` with a `urlStatus`
explaining why), `sourceType`, `priority` (1 highest – 6 lowest, the same
tiering used in `local-fact-checker/SKILL.md` and
`local-news-research/SKILL.md`), and `notes`.

### `image`
Pointers only — `libraryLocation`, `manifestLocation`,
`categoryPlaceholders`, and the real `supportedImageTypes` enum from
`src/lib/types.ts`'s `ArticleImageType`. Nothing in the image library or
manifest was touched to produce this.

### `article`
Pointers only — `contentDirectory`, plus references to
`src/lib/types.ts` and `src/lib/data/categories.ts` as the schema's
source of truth. No new schema is defined here.

### `newsletter`
The newsletter's name/language plus the tunable knobs
`local-newsletter/SKILL.md` already describes generically (approximate
story count, whether the short-updates/upcoming-info sections are
enabled). Configuration only — creating or sending a newsletter is a
separate, explicit action (`npm run newsletter:today` / `--force`, per
`scripts/build-newsletter.ts`), never triggered by this file existing.

## Existing project values reused

Every concrete value in `city-config.json` traces back to material
already in this repository:

- **City identity, district, province**: `PRODUCT_REQUIREMENTS.md`
  ("Mechinagar Municipality (Jhapa District, Koshi Province)") and
  `SOURCES.md`.
- **Municipality name (Nepali)**: `src/lib/data/categories.ts`'s
  category descriptions and multiple article `source` fields
  ("मेचीनगर नगरपालिका").
- **Language convention**: `src/lib/types.ts`'s `Language` type and the
  real `ne`/`en` mix across `content/articles/*.md`.
- **Local terminology**: drawn directly from real article bodies (e.g.
  "वडा नं. ९", "टोल विकास संस्था" in
  `mechinagar-ward9-drainage-cleanup.md`) and `SOURCES.md`.
- **Newsletter name**: the literal `# Mechinagar Local Daily` heading
  `scripts/build-newsletter.ts` already generates.
- **All source entries**: `SOURCES.md` (§1 government, §2 secondary
  press, §3 community/social, §4 sector-specific) and the `source`/
  `sourceUrl` frontmatter fields already present across
  `content/articles/*.md`.
- **Image/article pointers**: the real, current paths — `public/images/
  library/`, `public/images/library/manifest.json`,
  `public/images/categories/`, `content/articles/`, `src/lib/types.ts`,
  `src/lib/data/categories.ts`.

## No invented URLs

Per the task's explicit instruction, **no new official source URL was
invented**. Three government offices named as article-level sources
(Kakarbhitta Customs Office, Ward No. 9 Office, Road Division Office)
have `sourceUrl: null` in their originating articles and therefore have
`"url": null, "urlStatus": "not available in project sources — requires
configuration"` here — they are not guessed at. Two press sources
("Bizness News", "मेरो मेचीनगर") are recorded with only the specific
article URL already cited in this project (`exampleArticleUrl`), not a
guessed-at homepage. Four entire sector groups (`education`,
`agriculture`, `transport`, `environment`) have no source currently on
record in this project and are left as empty arrays with a `status` note
rather than filled with plausible-sounding entries.

## Security

This file contains **no API keys, passwords, tokens, or other
credentials** — only public source names, public URLs, and editorial
preferences. It must stay that way: if a future integration needs a
credential, it belongs in `.env.local` (see `src/lib/ai-image/config.ts`
for the existing pattern of reading credentials only from server-side
environment variables, never from a checked-in config file).

## Reusing this for another city

To set up a second city on the same five Skills:

1. Do not edit the five `SKILL.md` files.
2. Create that city's own `city-config.json` (and, if useful, its own
   README) with its own `cityIdentity`, `editorial`, `sources`, `image`,
   `article`, and `newsletter` sections — reusing only that city's own
   real project material, following the same "leave it empty or mark it
   as requiring configuration" discipline this file follows.
3. Point that city's article content directory, image library/manifest,
   and category list at its own project's real paths — never at this
   project's.
4. The methodology in all five Skills applies unchanged; only this
   configuration file (and the underlying articles/images/sources it
   points at) differs between City A (Mechinagar) and any future City B.
