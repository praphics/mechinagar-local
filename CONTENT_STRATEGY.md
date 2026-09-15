# Mechinagar Local — Content Strategy

Status: Draft v2 · Last updated: 2026-08-14

## 1. Editorial mission

Mechinagar Local exists to give residents of Mechinagar Municipality (Kakarvitta, Dhulabari, Itabhitta, Charali, and surrounding wards) accurate, timely, locally relevant information they can't easily get anywhere else in one place. National outlets cover Jhapa occasionally; Mechinagar Local covers it consistently.

The editorial job is best framed as answering, every day, "what's happening around Mechinagar today?" — not producing a paper-style edition. This mindset drives both the categories below and the "Today's Mechinagar" homepage identity (see §3.1 and HOMEPAGE_SPEC.md §2), and it's why news is treated as the MVP's primary content type within a broader information-platform vision that will eventually include community info, government notices, events, jobs, businesses, and border information (see PRODUCT_REQUIREMENTS.md §2).

## 2. Language approach — Nepali-first

Nepali is the primary content and navigation language; English is a supporting language, not a parallel one (see PRODUCT_REQUIREMENTS.md §4). In practice:

- **Nepali by default** for local news, government announcements, community stories, business/jobs, events — this is what most local readers want and expect, and it's the language used throughout site navigation.
- **English used specifically for:** technical terms without a natural Nepali equivalent, proper names (places, organizations, official titles), official/government terminology where precision matters, and URLs/metadata where it aids shareability and SEO. It is not used as a general substitute for Nepali prose.
- **English standalone articles** are published where genuinely useful — e.g. Kakarvitta border/trade/customs stories relevant to a wider trade and diaspora audience, or stories where the primary source material is already in English and translation would risk losing accuracy. These are their own pieces, not a mandatory second version of a Nepali article.
- **No full bilingual duplication requirement at MVP** — publishing every article in both Nepali and English is a "LATER" item once there's editorial capacity (see MVP_SCOPE.md). The per-article `language` field (see ARTICLE_PAGE_SPEC.md §4) keeps this possible later without rework.
- **Write in correct Unicode Nepali** — never Romanized/transliterated Nepali ("Nepali in English letters"). This is a content-production requirement, not just a technical one: it affects how editors (and any AI drafting assistance, see AI_CONTENT_WORKFLOW.md) produce copy from day one.

## 3. Content categories and what belongs in each

| Category | What goes here | MVP or Later |
|---|---|---|
| Local News | General Mechinagar-area news that doesn't fit a narrower category | MVP |
| Government & Announcements | Municipality (मेचीनगर नगरपालिका) notices, ward-level announcements, District Administration Office Jhapa notices, public services | MVP |
| Kakarvitta Border | Customs, immigration, cross-border trade, transport disruptions/openings at the Kakarvitta crossing | MVP |
| Business & Economy | New businesses, local commerce, cottage industry, market/trade activity | MVP |
| Community | Local events, human-interest stories, community organizations, achievements | MVP |
| Roads & Infrastructure | Road conditions, construction, utilities, Mechi Highway/East-West Highway-related local impact | MVP |
| Jobs | Local job postings and opportunities | Later (own category once volume justifies) |
| Education | Schools, local education news and opportunities | Later |
| Health | Health post/hospital updates, public health notices | Later |
| Events | Structured event listings (dates, times, locations) | Later |
| Public/Emergency Alerts | Time-critical safety information (flooding, road closures, security) | Later as a category; see note below on MVP handling |

**Note on alerts at MVP:** Even without a dedicated Alerts category, urgent public-safety information should still be publishable immediately as a Local News or Roads & Infrastructure article, and surfaced via the conditional alert component inside the "Today's Mechinagar" homepage section (see HOMEPAGE_SPEC.md §2.1). The category structure is an organizational later-stage refinement — it should never block publishing something urgent.

### 3.1 Feeding "Today's Mechinagar"

The homepage's daily identity section (see HOMEPAGE_SPEC.md §2) needs a small, honest editorial input each day: which 2–4 published stories are most important right now, and what the latest few updates are. This is a light curation task for the editor — a byproduct of normal publishing, not a separate content type or extra workload. Two rules carry over directly from the sourcing and editorial standards below (§5, §6):

- The optional alert/notice component is held to the **same verification bar as any other published claim** — it only appears when there is a genuine, sourced, important item, and it is left empty rather than filled with something marginal just to have content there.
- The "last updated" indicator must reflect real publish/update activity — never a decorative or fixed timestamp.

## 4. Content types

- **News articles** — the core content type. Short, factual, sourced, dated.
- **Announcements** — government/municipal notices, often near-verbatim republication with attribution and a plain-language summary.
- **Community stories** — softer, longer-form pieces about people, businesses, and events.
- **Roundups/briefs** — short multi-item digests (e.g. "This week in Mechinagar") — useful both for the site and as newsletter content.

## 5. Sourcing approach

Content should be built primarily from **verified local and official sources** (see SOURCES.md for the full list), supplemented by original reporting/observation once the editor has capacity. Do not invent facts or attribute quotes/claims that cannot be traced to a source. Every published article should be traceable to: an official source (municipality, district office, police, immigration), a reputable news outlet, direct community submission (verified), or original observation/interview by the editor.

Priority order when a story could come from multiple places:
1. Official source (municipality, DAO Jhapa, immigration, police) — highest trust, publish with attribution.
2. Established Nepali news outlets with Jhapa/Mechinagar coverage (Ratopati, Nepal News, Online Khabar, etc.) — used for context, cross-referencing, and stories Mechinagar Local didn't catch first; always attribute and link back, don't republish wholesale.
3. Community sources (local Facebook pages/groups) — useful as early signals of local happenings, but treated as leads to verify, not as citable facts on their own.
4. Original reporting — the long-term differentiator, built up over time as the outlet gains trust and contacts.

## 6. Editorial standards (lightweight, for a one-person operation)

- Every article has a byline (even if it's just "Mechinagar Local") and a publish date.
- Every factual claim traces to a stated source; link to primary sources where public (e.g. municipality notice, official press release).
- Corrections are made transparently — a visible "Updated" note and short explanation, not silent edits, once there's any readership to speak of.
- No anonymous, unverifiable claims are published as fact — rumors and unverified community reports are either left out or explicitly labeled as unverified.

## 7. Cadence (MVP)

Realistic for one person: aim for a small, sustainable steady cadence (e.g. a handful of articles per week) rather than a daily-news commitment that can't be kept up. Consistency and accuracy matter more than volume in the first months — see MVP_SCOPE.md for how this maps to newsletter frequency.

## 8. Content NOT to pursue at MVP

- Investigative/long-form journalism requiring significant time investment.
- Opinion/editorial columns (adds editorial-voice risk before the outlet has established neutral credibility).
- User-generated/open-submission publishing without review.
- Paid/sponsored content (no monetization infrastructure at MVP — see MVP_SCOPE.md).
