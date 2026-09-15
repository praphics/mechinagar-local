# Mechinagar Local — MVP Scope

Status: Draft v2 · Last updated: 2026-08-14

This document is the definitive scope reference. If another document seems to imply something broader, this one wins.

## 1. MVP goal

Prove that a fast, modern, trustworthy local information platform — Nepali-first, with a strong "Today's Mechinagar" daily identity, and news as its primary content type — plus a beehiiv newsletter, can attract and retain Mechinagar-area readers. Run entirely by one person, at near-zero cost, with a fully manual (no AI automation) publishing workflow, and with an information architecture that can grow into community info, government notices, events, jobs, business, and border information later without a redesign.

## 2. Guiding constraints

- One person, part-time, no team.
- Near-zero recurring cost (target: $0–$5/month; see PRODUCT_REQUIREMENTS.md §7 for hosting/domain notes).
- No custom email infrastructure — beehiiv only.
- No AI automation in the publishing path — human writes/reviews/publishes everything at MVP (see AI_CONTENT_WORKFLOW.md §7, Phase 0).
- Nepali-first language: Nepali is the default for content and navigation; English is supporting only (technical terms, proper names, official terminology, URLs/metadata) — not a parallel bilingual system (see CONTENT_STRATEGY.md §2).
- One daily-identity section ("Today's Mechinagar"), not multiple competing highlight/urgency modules — keeps both the design and the editor's daily workload simple (see HOMEPAGE_SPEC.md §2).
- Information architecture must support future sections (jobs, business, events, notices, border info) additively — as a design constraint on MVP decisions, not as MVP features themselves (see WEBSITE_STRUCTURE.md).

## 3. MVP feature list

- Homepage: "Today's Mechinagar" (आज मेचीनगरमा) daily identity section (dynamic date, important stories, latest-updates teaser, conditional verified alert, updated indicator) + full reverse-chronological latest news feed + newsletter subscribe block + category shortcuts (see HOMEPAGE_SPEC.md).
- Article pages: clean reading layout, Nepali-first typography, source attribution, social sharing, SEO metadata, related articles (see ARTICLE_PAGE_SPEC.md).
- 6 launch categories: Local News, Government & Announcements, Kakarvitta Border, Business & Economy, Community, Roads & Infrastructure — structured to extend later without redesign (see CONTENT_STRATEGY.md §3, WEBSITE_STRUCTURE.md §3).
- Newsletter subscription via embedded beehiiv form (site) + weekly digest issue (see NEWSLETTER_STRATEGY.md).
- Basic search results page.
- About, contact/submit, and corrections-policy pages.
- SEO fundamentals: sitemap.xml, robots.txt, per-page metadata, Open Graph, JSON-LD structured data.
- Mobile-first responsive layout across all pages, designed for genuinely comfortable Nepali (Devanagari) reading, not adapted from an English-first template.
- Simple publishing workflow for one editor (specific tool — e.g. headless CMS vs. Markdown/Git — is an implementation decision outside this document's scope).

## 4. Explicitly excluded from MVP (and why)

| Feature | Why excluded now |
|---|---|
| User accounts / logins | No functional need yet; adds auth/security/privacy burden |
| Comments | High moderation burden for one person; route engagement to Facebook/newsletter instead |
| Native mobile app | Mobile-first responsive website covers the mobile use case without app-store overhead |
| Custom email/newsletter infrastructure | beehiiv already solves deliverability, unsubscribe compliance, analytics |
| Payments / paywalls / sponsored content | No monetization need proven yet; adds compliance and engineering surface |
| Complex editorial dashboard | A solo editor doesn't need newsroom-grade tooling; keep the workflow lightweight |
| AI agents that publish autonomously | Credibility risk in a small community; human review is non-negotiable at this stage |
| Dedicated Jobs/Business/Events directories | Better handled as categorized articles until volume justifies structured directories |
| Multi-language full parallel publishing | Doubles editorial workload before there's capacity to sustain it |
| Nepali (Bikram Sambat) calendar conversion in "Today's Mechinagar" | The Gregorian date, generated dynamically and localized to Nepal time, already satisfies the "dynamic, never hardcoded" requirement; a BS-calendar library is an added dependency and conversion-accuracy risk not justified until the section's core pattern is proven |
| Multiple/competing "breaking" or urgency UI treatments | A single, honest, conditional alert inside "Today's Mechinagar" is enough; more than one urgency signal risks fake-urgency design, which the product explicitly avoids |

## 5. Definitive priority list

### MUST HAVE
- Fast, mobile-first homepage with the "Today's Mechinagar" (आज मेचीनगरमा) daily identity section — dynamic date, important stories, latest-updates teaser, conditional verified alert (hidden when there's nothing genuine to show), and a real "updated" indicator — plus the full latest news feed below it
- Article pages with clean reading experience, correct SEO metadata, and social sharing
- Nepali-first content and navigation, with English used only as a supporting language (technical terms, proper names, official terminology, URLs/metadata) — no mandatory bilingual publishing
- 6 launch categories (Local News, Government & Announcements, Kakarvitta Border, Business & Economy, Community, Roads & Infrastructure), structured as an extensible list so future sections can be added without redesign
- Newsletter subscription via beehiiv, embedded on homepage and article pages
- SEO fundamentals (sitemap, metadata, structured data, clean URLs)
- Simple, low-friction manual publishing workflow for one editor
- Strong, unmistakable local identity — Mechinagar-specific branding, place names, Nepali-first language, and "Today's Mechinagar" as the flagship identity element
- A modern, clean, community-oriented visual feel — not a traditional newspaper layout (see HOMEPAGE_SPEC.md §1 for the specific "avoid" list: no excessive cards, animation, autoplay media, fake urgency, or clickbait design)

### SHOULD HAVE
- Weekly beehiiv newsletter digest built from published articles
- Search results page
- About / corrections-policy / community-submission pages

### LATER
- Dedicated Jobs, Education, Health, Events categories/sections
- Structured business directory and events calendar
- Author pages (once more than one contributor)
- Tags and cross-cutting discovery
- AI-assisted research/drafting workflow (Phase 1+ per AI_CONTENT_WORKFLOW.md)
- n8n-based source-monitoring automation
- Full bilingual (Nepali + English) parallel publishing
- Newsletter segmentation (e.g. topic-specific editions)
- Nepali (Bikram Sambat) calendar/date display in "Today's Mechinagar"

### DO NOT BUILD YET
- User accounts / logins
- Comments
- Native mobile app
- Custom email delivery/subscriber infrastructure
- Payments, subscriptions, or paywalls
- Autonomous AI publishing agents
- Advertising/sponsorship systems
- Complex editorial/newsroom dashboards
