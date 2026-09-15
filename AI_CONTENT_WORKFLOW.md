# Mechinagar Local — AI Content Workflow

Status: Draft v1 · Last updated: 2026-08-14 · **Future capability — not built at MVP** (see MVP_SCOPE.md)

## 1. Governing principle

**AI assists; a human decides what gets published.** No AI system in this workflow is permitted to publish content to the live site or send a newsletter issue without a human review step. This is a hard constraint, not a preference — local news credibility in a small, tightly-knit community depends on accuracy, and AI systems can produce confident-sounding factual errors.

## 2. Where AI helps (future, staged rollout)

1. **Source monitoring / research assistance** — periodically checking the sources in SOURCES.md (municipality notices, DAO Jhapa, immigration office, established news outlets' Jhapa coverage, local Facebook pages) for new items relevant to Mechinagar.
2. **Summarization** — condensing longer official notices or source articles into a plain-language summary for the editor to review.
3. **Story importance triage** — flagging which of several candidate items look most locally significant (e.g. a border closure vs. a minor procedural notice), as a sorting aid — not a decision-maker.
4. **Draft generation** — producing a first-draft article from verified source material, clearly marked as an AI draft pending review.
5. **Duplicate detection** — checking whether a candidate story has already been covered by Mechinagar Local or is substantially the same as another pending item.
6. **Newsletter draft assembly** — compiling a draft newsletter issue from the week's published articles.
7. **Social media draft generation** — drafting short social posts (e.g. for Facebook) to accompany published articles.

## 3. Where AI must NOT operate

- Publishing an article directly to the live site.
- Sending a newsletter issue directly via beehiiv.
- Posting to social media accounts directly.
- Inventing facts, quotes, or figures not present in a verified source.
- Making editorial judgment calls about sensitive/controversial local matters without human sign-off.

## 4. Proposed workflow (human-in-the-loop at every publish step)

```
1. MONITOR   → AI checks known sources for new items (see SOURCES.md)
2. SUMMARIZE → AI produces a short summary + source link for each candidate item
3. TRIAGE    → AI suggests relative importance; editor makes the actual call
4. DRAFT     → AI produces a draft article from verified source material only
                (draft is clearly labeled "AI draft — unreviewed")
5. REVIEW    → Editor reviews, fact-checks, edits, and approves or rejects
6. PUBLISH   → Editor (human action) publishes the approved article
7. NEWSLETTER→ AI assembles a draft issue from published articles;
                editor reviews and sends via beehiiv
8. SOCIAL    → AI drafts social copy for published articles;
                editor reviews and posts
```

Every arrow into PUBLISH, NEWSLETTER send, and SOCIAL post requires an explicit human action.

## 5. Duplicate-checking approach (conceptual)

Before drafting, check candidate stories against: (a) Mechinagar Local's own recently published articles, and (b) other pending draft candidates in the same review cycle. This is described conceptually here; the actual matching technique (e.g. simple keyword/entity overlap vs. more advanced similarity checks) is an implementation decision for later.

## 6. Automation platform (future)

The project vision names **n8n** as the likely future automation platform for orchestrating the monitor → summarize → draft pipeline (e.g. scheduled checks of SOURCES.md sources, routing drafts to the editor for review). This is a future-phase infrastructure decision — not part of MVP, and no workflow should be built until the manual, human-only publishing process (see MVP_SCOPE.md) is working well on its own.

## 7. Staging plan (do not build all at once)

1. **Phase 0 (MVP):** No AI workflow at all. Editor manually monitors sources and writes/publishes articles. This validates the content strategy and editorial voice before adding tooling.
2. **Phase 1:** AI-assisted summarization and draft generation only, used manually (e.g. editor pastes source text into an AI tool) — no automation/orchestration yet.
3. **Phase 2:** Source monitoring automation (e.g. via n8n) that surfaces candidate items to the editor, still fully manual drafting/review/publish.
4. **Phase 3:** Full assisted pipeline (monitor → summarize → draft → human review queue), newsletter and social draft assembly included — still human-gated at every publish point.

Do not attempt Phase 2+ until Phase 0/1 content quality and editorial workflow are proven — this avoids building automation around a process that hasn't been validated yet.

## 8. Risk notes

- AI-drafted content must be clearly distinguishable from human-written content in any internal review tooling (labeling, not published-facing — readers should not need to know or care which parts were AI-assisted, but the editor must always know what's been verified vs. not).
- Any AI system with access to source monitoring should be scoped to the verified sources in SOURCES.md — not open-ended web search — to reduce the risk of low-quality or unreliable inputs.
