# Deploying this system for a new city

This document is the packaging guide produced by the Phase 9 reusability
test (2026-08-17), which proved — using a real, disposable second-city
fixture (Pokhara Metropolitan City) — that the newsroom engine can be
redeployed for a different city through configuration and content alone,
without editing the Skills or the reusable `src/lib`/`scripts` engine.

## Deployment model

```
CITY A (this deployment — Mechinagar)          CITY B (a future deployment)
├── .claude/city-config.json                   ├── .claude/city-config.json
├── content/articles/                          ├── content/articles/
├── public/images/library/                     ├── public/images/library/
├── .claude/newsroom/state.json                ├── .claude/newsroom/state.json
├── content/newsletters/                       ├── content/newsletters/
├── .claude/newsletter-beehiiv/state.json      ├── .claude/newsletter-beehiiv/state.json
└── Beehiiv publication A                      └── Beehiiv publication B (or none)
```

**One project copy = one city.** A second city is a separate copy of this
repository, not a runtime city-switcher inside this one. The two copies
share:

- source code (`src/`, `scripts/`)
- the seven Skills (`.claude/skills/`)
- the article schema, fact-checking methodology, image-editorial
  methodology, newsletter-generation methodology, Beehiiv integration
  pattern, editorial dashboard, and approval/publishing gates

...and have entirely separate:

- `.claude/city-config.json` and its README
- `content/articles/`, `content/newsletters/`
- `public/images/library/` and its manifest
- `.claude/newsroom/state.json` (workflow state)
- `.claude/newsletter-beehiiv/state.json` (Beehiiv draft cache)
- Beehiiv publication (own `publicationId`, or none configured yet)

**Newsroom state, image libraries, and Beehiiv state must never be shared
between cities.** They are keyed by date/slug, not by city, so a shared
file would silently mix two cities' editorial state.

## Steps to create a new city

1. Copy the project to a new location (a new git repo/deployment).
2. Replace `.claude/city-config.json` with the new city's own identity,
   editorial preferences, sources, image/article/newsletter pointers —
   see `.claude/city-config.README.md` for the field-by-field schema and
   the "leave it empty / mark as requiring configuration" discipline for
   anything not yet verified. **Do not invent source URLs** — verify each
   one is real before adding it (see this test's own sourcing, section
   "Second-city configuration tested" below, for the verification bar).
3. Populate that city's own source list per sector (municipality,
   government, education, agriculture, health, transport, business,
   community, environment, other).
4. Set `editorial.localTerminology`, `cityIdentity.localityTerms`, and the
   newsletter identity (`newsletter.newsletterName`, language).
5. Populate `public/images/library/` and its `manifest.json` with that
   city's own approved photographs (see `src/lib/library/manifest.ts`).
   Start empty if none yet — the matcher degrades safely to placeholders.
6. Point `content/articles/` at that city's own (initially empty) content
   directory — this is a fixed path within the new copy, not a
   config-swappable one; see "What does NOT change automatically" below.
7. Confirm/adjust `src/lib/data/categories.ts` for the new city (see the
   note on `kakarvitta-border` below — this file is project-schema, not
   city-config, so it's a manual code edit, same discipline as any other
   code change).
8. Configure a **separate** Beehiiv publication (`newsletter.beehiiv.
   publicationId`) — or leave it `null` until one exists. `scripts/
   newsletter-beehiiv-draft.ts` safely refuses to call Beehiiv when this
   is unset (verified live in this test — see below).
9. Run validation: `node --experimental-strip-types scripts/
   check-city-agnostic.ts`, then `npm run lint`, `npx tsc --noEmit`,
   `npm run build`.
10. Start the newsroom: `/local-news today` against the new
    `city-config.json`.

## Changes required for a new city

- `.claude/city-config.json` (full replacement)
- `content/articles/`, `content/newsletters/` (that city's own, separate directories)
- `public/images/library/` + `manifest.json` (that city's own images)
- `src/lib/data/categories.ts` — **the one piece of code a new city
  legitimately edits.** It is deliberately project-schema (not
  city-config), per an existing, pre-Phase-9 architectural decision (see
  `scripts/build-newsletter.ts`'s own comment on "do not create a second
  competing schema"). Concretely, for Mechinagar this file defines a
  `kakarvitta-border` category with a Mechinagar-specific description —
  a new city should replace or remove categories that don't apply to it,
  the same way it would edit any other piece of its own project code.
- `src/lib/site-config.ts`, `src/components/Header.tsx`, `Footer.tsx`,
  `TodaysMechinagar.tsx`, and the public pages (`about`, `submit`,
  `search`, `newsletter`) under `src/app/` — **these are the public
  marketing site's presentation copy, not the newsroom engine.** Phase
  9's reusability test found these hardcode Mechinagar branding/Nepali
  copy directly (see the test's hardcoding audit). This is a real,
  separate limitation for full turnkey site reuse, but it sits outside
  the newsroom-engine scope this test validates (Skills, workflow,
  schema, fact-checking, image editorial, newsletter generation,
  Beehiiv, dashboard) — a new city currently edits this UI copy by hand,
  the same way it would edit any other page.

## Files that should NOT be modified

**DO NOT MODIFY** for a new city (per each file's own "Reusability"
section, confirmed by this test):

- `.claude/skills/local-news-research/SKILL.md`
- `.claude/skills/local-fact-checker/SKILL.md`
- `.claude/skills/local-article-writer/SKILL.md`
- `.claude/skills/local-image-editorial/SKILL.md`
- `.claude/skills/local-newsletter/SKILL.md`
- `.claude/skills/local-newsroom-orchestrator/SKILL.md`
- `.claude/skills/local-news/SKILL.md`

...unless a genuine architectural defect is found (none were found by
this test — see the Phase 9 final report for the full audit).

Also do not modify (reusable engine, config-driven, verified by this
test): `src/lib/library/match.ts`, `src/lib/cityConfig.ts`, `src/lib/
newsroom/*.ts`, `scripts/build-newsletter.ts`, `scripts/
newsletter-beehiiv-draft.ts`, `scripts/newsroom-action.ts`, `src/app/
newsroom/*`.

## What does NOT change automatically

Within a single project copy, `content/articles/`, `content/newsletters/`,
and `public/images/library/` are fixed paths (`process.cwd()`-relative),
not read from `city-config.json`. Swapping only `city-config.json` (as
this test did, temporarily, to prove the dashboard's branding is
config-driven) changes every city-identity label the dashboard shows, but
NOT which articles/images/newsletters are loaded — those come from
whichever copy of the repository is actually running. This is intentional
(see "One project copy = one city" above), not a gap — a genuine second
city gets its own separate content by being its own separate copy.
