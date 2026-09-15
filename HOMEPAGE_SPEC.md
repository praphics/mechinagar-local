# Mechinagar Local — Homepage Spec

Status: Draft v2 · Last updated: 2026-08-14

This is a functional/UX spec, not a visual design or implementation. Mobile-first: describe the mobile layout first, then how it expands on larger screens.

**Positioning note:** the homepage should read as a modern, clean, community-oriented local information hub — not a traditional newspaper front page. See §1 for the specific goals and the "avoid" list, and PRODUCT_REQUIREMENTS.md §2 and §5 for the underlying product positioning.

## 1. Goals for the homepage

1. Immediately communicate "this is where Mechinagar finds out what's happening" — strong local identity, not a generic template and not a newspaper pastiche.
2. Answer "what's happening around Mechinagar today?" within the first screen of mobile scrolling, via the "Today's Mechinagar" section (see §2).
3. Surface the most important and most recent stories with minimal scrolling.
4. Make newsletter subscription obvious and low-friction.
5. Load fast on a mid-range phone over 3G/4G.
6. Be crawlable and well-structured for SEO (real HTML content, not JS-only rendering — Next.js SSR/SSG handles this).
7. Feel modern and calm, not busy or alarming — see the "avoid" list below.

**Avoid (visual/UX design principles for the whole homepage, not just one section):**
- Generic AI-generated news-site aesthetics
- Traditional newspaper clutter (dense multi-column layouts, heavy rules/dividers, masthead formality)
- Excessive cards or visually noisy grids
- Excessive animation or motion
- Autoplay media of any kind
- Fake urgency (e.g. countdown timers, permanent "breaking" styling, alert-style treatment applied to routine content)
- Clickbait headline framing or layout
- Overly complicated navigation

## 2. "Today's Mechinagar" (आज मेचीनगरमा) — daily identity section

This is the homepage's core identity element and should sit near the top, directly below the header. It is what makes the site feel like something residents check regularly, and it is designed to answer "what's happening around Mechinagar today?" at a glance.

**Contents:**
- **Section heading**, bilingual: "आज मेचीनगरमा" as the primary heading with "Today's Mechinagar" as a smaller supporting label — reinforces brand identity while staying Nepali-first.
- **Current date**, shown in a clear, human-readable format. The date **must be generated dynamically by the application at render/request time** (server-rendered or client-rendered from the current date) — never hardcoded or manually edited by the editor. Localize to Nepal time (Asia/Kathmandu, UTC+5:45) so "today" always matches the local calendar day for readers in Mechinagar, even though the site may be hosted/rendered on infrastructure in a different timezone.
- **Important local stories**: a small number (roughly 2–4) of the most important current stories, functioning as this section's lead/highlight content — this replaces a separate standalone "lead story" block from the previous draft, folding that role into this section.
- **Latest updates**: a short, condensed list of the most recent items (e.g. 3–5 headlines) — a teaser for the full reverse-chronological feed in §3, not a duplicate of it. Readers who want more scroll to the full "Latest news" list below.
- **Optional alert/notice** — see §2.1 below. Conditional; hidden entirely when there is nothing to show.
- **"Updated" indicator** — a clear, visible marker of when the content was last refreshed (e.g. "अद्यावधिक: [time]" / "Updated [time]"), building trust that the section is genuinely current and not stale/decorative. This should reflect real publish/update timestamps of the underlying content, not a fixed or fake value.

**Visual treatment:** distinctive enough to be recognizable as the site's signature section (e.g. a subtly different background treatment or border), but restrained — no heavy color blocking, no animation, no autoplay. It should feel calm and trustworthy, consistent with §1's "avoid" list.

### 2.1 Optional alert/notice component

- Appears **only** when there is a genuine, verified, important local alert or notice (e.g. a confirmed border closure, a confirmed major road closure, an official public-safety notice from a source in SOURCES.md).
- **Hidden entirely** — not shown in a collapsed, greyed-out, or "no alerts" state — when there is nothing to show. The section should never manufacture a sense of urgency.
- Must never be based on invented or unverified information (see CONTENT_STRATEGY.md §5 and §6 on sourcing and editorial standards — the same verification bar applies here).
- Must not rely on color alone to communicate urgency — include a clear icon and text label (see §8, Accessibility).
- This component is the MVP's mechanism for surfacing urgent information, replacing the standalone "urgent alert banner" concept from the previous draft — it now lives inside "Today's Mechinagar" rather than as a separate element, which keeps the homepage's identity section as the single place residents check for anything time-sensitive.

### 2.2 Future enhancement (not MVP)

Nepali (Bikram Sambat) calendar date display alongside or instead of the Gregorian date is a natural future enhancement for this section, given its role as the site's daily-identity anchor. **Do not add a Nepali-calendar conversion dependency at MVP** — the Gregorian date, correctly localized to Nepal time and generated dynamically, is sufficient to satisfy "the date must be dynamically generated" without introducing an unnecessary library or conversion-accuracy risk this early. Revisit once the section's core pattern is proven.

## 3. Layout, mobile-first (top to bottom)

1. **Header (sticky or lightweight):** Site name/logo ("Mechinagar Local"), compact hamburger menu, search icon. Keep it short — vertical space is precious on mobile.
2. **"Today's Mechinagar" (आज मेचीनगरमा) section:** see §2 above — date, important stories, latest-updates teaser, optional alert, updated indicator.
3. **Latest news list:** Reverse-chronological list of recent articles across all categories — headline, category tag, timestamp, and a one-line summary. This is the full "what's happening" feed (the complete version of the teaser in §2) and should be the dominant scrolling content at MVP, since a young publication won't yet have enough volume to justify heavy per-category sectioning.
4. **Newsletter subscribe block:** A dedicated, visually distinct section with a short value proposition ("Get Mechinagar news in your inbox") and an email input + subscribe button (beehiiv embed). Placed high enough to be seen without excessive scrolling, but after the news content people actually came for.
5. **Category shortcuts:** Simple links/chips to the MVP categories (Local News, Government & Announcements, Kakarvitta Border, Business & Economy, Community, Roads & Infrastructure). Designed as a flat, extensible row/grid so future categories (Jobs, Events, etc.) can be added without changing the layout pattern.
6. **Footer:** About, contact/submit, newsletter (secondary reminder), social links, corrections policy.

## 4. Larger screens (tablet/desktop)

Same content, reflowed into a wider layout: "Today's Mechinagar" can widen into a multi-column band (e.g. date/updated-indicator alongside the important-stories list) rather than a tall stack; the latest news feed and newsletter/category shortcuts can sit in a main-column-plus-sidebar arrangement. No content should be desktop-only — mobile users should never get a reduced version of the actual news content or of "Today's Mechinagar."

## 5. What's intentionally NOT on the MVP homepage

- Per-category horizontal carousels or complex multi-row curated sections (adds editorial curation burden one person can't sustain, and adds JS/layout complexity).
- Trending/most-read algorithmic modules (not enough traffic at MVP for this to be meaningful, and adds analytics/engineering complexity).
- Video/multimedia hero sections.
- Personalization of any kind (requires accounts/tracking — out of scope).
- Ads or sponsor placements (no monetization infrastructure at MVP).
- Any second "breaking news" or urgency treatment outside the single conditional alert in §2.1 — one honest signal, not several competing ones.

## 6. Content freshness and empty states

- If there are fewer than ~5 recent articles (early launch), the homepage should still look intentional — e.g. a short "We're just getting started" note is acceptable, but avoid obviously empty sections (like a category shortcut leading to zero articles being visually prominent).
- "Today's Mechinagar" should degrade gracefully when there are few stories on a given day — e.g. showing 1–2 important stories rather than forcing a fixed count, and never padding with unrelated or stale content just to fill the section.

## 7. Performance requirements

- Homepage should be statically generated or server-rendered with incremental revalidation (Next.js ISR) so it's fast and always reasonably fresh without a full rebuild per article.
- The "Today's Mechinagar" date must reflect the actual current date at request/render time — this has implications for caching strategy (e.g. revalidation frequency, or rendering the date client-side) that should be worked out at build time, not decided in this document.
- Images (if any) lazy-loaded and served responsively/optimized (Next.js Image component handles this at build time — implementation detail, not decided here).
- No render-blocking third-party scripts above the fold. The beehiiv subscribe embed should be loaded in a way that doesn't block initial page render.

## 8. SEO/sharing requirements for the homepage

- Descriptive `<title>` and meta description referencing Mechinagar, Jhapa, and the site's purpose, in Nepali with English support where it aids discoverability (see PRODUCT_REQUIREMENTS.md §4).
- Open Graph image and metadata for link previews when shared on Facebook/social (important given Facebook is the dominant local social platform).
- JSON-LD `Organization`/`WebSite` structured data.
- `sitemap.xml` includes the homepage and all published articles/categories.

## 9. Accessibility

- Sufficient color contrast for text on any background/hero treatment, including the "Today's Mechinagar" section.
- The optional alert component (§2.1) must not rely on color alone — include an icon and clear text.
- All interactive elements (menu, search, subscribe form) reachable and operable by keyboard.
- Nepali (Devanagari) text must use a font and sizing that renders conjuncts and matras clearly at mobile sizes, with line-height generous enough for comfortable reading — Devanagari typically needs more vertical breathing room than Latin script at the same point size.
