# Mechinagar Local — Website Structure

Status: Draft v2 · Last updated: 2026-08-14

This document defines the information architecture: sitemap, navigation, categories, and URL structure. No application code — this is the structural blueprint for the future Next.js build.

**Positioning note:** Mechinagar Local is a modern local *information platform*, not a digitized newspaper (see PRODUCT_REQUIREMENTS.md §2). At MVP, news is the primary content type and the only fully built-out area — but this information architecture is deliberately shaped so that community info, government notices, events, jobs, local businesses, and border information can be added later as first-class sections (new routes/categories) without restructuring the site. Everywhere below, "deferred to future" means the underlying structure already anticipates the addition, not that it's an afterthought.

## 1. Sitemap (MVP)

```
/                          Homepage
/category/[slug]           Category listing (e.g. /category/local-news)
/article/[slug]            Individual article
/tag/[slug]                 Tag listing (future — see §4)
/newsletter                 Newsletter landing / subscribe page
/about                      About Mechinagar Local (mission, contact, corrections policy)
/submit                     Community submission info (see below)
/search                     Search results
/sitemap.xml, /robots.xml   SEO infrastructure (not user-facing pages)
```

### Deferred to future (not MVP)
```
/jobs                        Dedicated jobs board
/business/[slug]              Business directory listing pages
/events                       Events calendar
/alerts                       Dedicated public/emergency alerts feed
/author/[slug]                 Author pages (relevant once there's more than one contributor)
```

Rationale: at MVP, jobs/business/events content is published as regular categorized articles, not as a separate structured directory. A directory implies data modeling, moderation, and freshness upkeep that one person can't sustain yet. Once volume justifies it, these become first-class sections (see MVP_SCOPE.md, "LATER"). Note there is deliberately **no dedicated route for "Today's Mechinagar"** — it is a homepage section, not a separate page (see HOMEPAGE_SPEC.md §2), so it needs no sitemap entry of its own.

## 2. Primary navigation (MVP)

Per the Nepali-first language policy (see PRODUCT_REQUIREMENTS.md §4), **navigation labels are in Nepali by default** — English is not a parallel navigation layer, only used where it aids clarity (e.g. a proper name) or in metadata. Mobile-first means the nav must work as a compact hamburger/menu on small screens first. Proposed top-level nav (Nepali labels primary, English in parentheses for this doc only, for the reader's reference):

1. गृहपृष्ठ (Home)
2. स्थानीय समाचार (Local News)
3. सरकारी सूचना (Government Announcements)
4. व्यापार/स्थानीय व्यवसाय (Business)
5. रोजगार (Jobs)
6. काँकडभिट्टा नाका (Kakarvitta Border)
7. न्यूजलेटर (Newsletter) — prominent, likely a persistent header button rather than a plain nav item
8. बारेमा (About)

Keep the nav to 6–8 items max — this is also a "modern platform, not newspaper" principle: newspapers cram in dense section lists, a modern local information platform keeps navigation simple and uncluttered (see PRODUCT_REQUIREMENTS.md §5, principle 7). Everything else (health, education, roads/infrastructure, events, alerts) exists as categories reachable from the homepage and category pages, not necessarily all in the top nav — see CONTENT_STRATEGY.md for the full category list and which ones are nav-level vs. homepage-section-level at MVP.

## 3. Category structure

Categories map directly to the content areas in the project vision. At MVP, we launch with a smaller set and expand as content volume justifies it (an empty category looks worse than no category).

**MVP categories (launch with these):**
- Local News (general catch-all for anything not yet in its own category)
- Government & Announcements
- Kakarvitta Border
- Business & Economy
- Community
- Roads & Infrastructure

**Add once there's a steady stream of content (post-MVP):**
- Jobs
- Education
- Health
- Events
- Public/Emergency Alerts (at MVP, urgent items surface through the conditional alert component inside the "Today's Mechinagar" homepage section rather than a dedicated category — see HOMEPAGE_SPEC.md §2.1; a full Alerts category/archive is a later addition once volume justifies it)

Rationale: Starting with 6 categories rather than all 12 avoids empty or near-empty category pages, which look abandoned and hurt trust and SEO (thin content pages). Categories should visibly have content before they're promoted in navigation. The category model itself (a flat, extensible list, each with its own listing route) is the same structure that will eventually hold Jobs, Education, Health, Events, and Alerts — adding one is adding a row to this list and a listing page, not redesigning the site.

## 4. Tags (future)

Tags (e.g. "Ward 6", "Mechi Highway", "flooding") are a future enhancement for cross-cutting discovery once there's enough article volume. Not needed at MVP — categories alone are sufficient for a small initial archive.

## 5. URL structure

- Articles: `/article/[slug]` where slug is a URL-safe, human-readable, English-transliterated or English slug even for Nepali-language articles (e.g. `/article/kakarvitta-border-customs-reopens`) — this keeps URLs SEO-friendly and shareable regardless of content language. This is exactly the kind of "English where it helps" use described in the Nepali-first language policy (see PRODUCT_REQUIREMENTS.md §4): the reading content stays Nepali, the URL/metadata layer uses English for discoverability.
- Categories: `/category/[slug]` (e.g. `/category/kakarvitta-border`)
- Keep URLs stable once published — do not change slugs after publication (breaks shared links and SEO).

## 6. Footer (MVP)

- About / mission
- Contact / how to submit a tip or correction
- Newsletter signup (secondary placement — primary is elsewhere on the page, see HOMEPAGE_SPEC.md)
- Social links (whichever platforms are actually active — likely Facebook, given its dominance for local Nepali audiences)
- Corrections policy (a short, honest statement builds trust — important for a young local news brand)

## 7. Community submissions ("/submit")

MVP: a simple page explaining how residents can submit a tip, story idea, or event — via a form (e.g. embedded Google Form or a simple contact form) or a listed email/Facebook contact. **Not** a self-serve publishing portal — all submissions are reviewed and, if used, written up by the editor. This avoids moderation and spam risks of open publishing.

## 8. What's deliberately not in the structure yet

- No user account areas, login, or profile pages.
- No paywall or subscription-tier gated pages.
- No multi-author CMS-style dashboard exposed publicly.
- No comment sections (high moderation burden for one person; community engagement is better routed to Facebook/newsletter replies at MVP).
