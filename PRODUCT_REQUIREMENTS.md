# Mechinagar Local — Product Requirements

Status: Draft v2 · Owner: Prabesh · Last updated: 2026-08-14

## 1. Problem statement

Mechinagar Municipality (Jhapa District, Koshi Province) — covering Kakarvitta, Dhulabari, Itabhitta, Charali and surrounding wards — has no single, trustworthy, digital source for local news and community information. Residents currently rely on a mix of national news outlets (which rarely cover hyperlocal Mechinagar stories in depth), scattered Facebook pages and groups, word of mouth, and municipal notice boards. Government announcements, business listings, job postings, and public-safety alerts are fragmented across sources that are hard to discover and not searchable.

Mechinagar sits at a strategically important spot — it is a major trade and transit hub on the Nepal–India border at Kakarvitta, on the Mechi Highway/East-West Highway junction — which means there is a steady stream of locally relevant news (border/customs, trade, transport, infrastructure) that national media covers only when it's dramatic, and rarely with follow-up.

What residents actually want day to day is simple: a fast answer to "what's happening around Mechinagar today?" — not a digital reproduction of a print newspaper.

## 2. Vision

Mechinagar Local becomes the modern, trustworthy local information platform for Mechinagar Municipality — a single place residents check regularly to quickly understand what's happening locally, and a single place local organizations and businesses know to reach residents through.

**Product positioning.** Mechinagar Local should not feel like a traditional newspaper — no dense front-page-style layout, no newspaper-style section clutter, no editorial "masthead" formality. It should feel like a clean, modern, community-oriented local information hub, closer in spirit to a well-organized community bulletin than a paper. News is the anchor content type, but the platform's identity is broader: local news, community information, government announcements, events, jobs, local businesses, public notices, roads and infrastructure updates, Kakarvitta/border information, useful local information, and community submissions all belong under one roof over time.

At MVP, **news remains the primary content type** (see MVP_SCOPE.md) — but the information architecture (see WEBSITE_STRUCTURE.md) is deliberately built so these other areas can be added later as their own sections without requiring a major redesign.

## 3. Target users

- **Residents of Mechinagar Municipality** (Kakarvitta, Dhulabari, Itabhitta, Charali, and other wards) — primary audience. Want to know what's happening locally: news, alerts, events, services.
- **Local businesses and organizations** — want visibility for announcements, openings, and events.
- **People with ties to Mechinagar living elsewhere** (other parts of Nepal, or abroad) — want to stay connected to home.
- **Cross-border/transit audience** — people using or affected by the Kakarvitta border crossing (traders, travelers) who need practical, current information.

## 4. Language — Nepali-first

**Decision: Nepali is the primary content and navigation language.** Most day-to-day local readers in Mechinagar read Nepali; this is the language of the municipal office, local Facebook community pages, and most hyperlocal source material. Navigation, headlines, article bodies, and the newsletter default to Nepali.

**English is a supporting language, not a parallel one**, used where it genuinely helps rather than as a full translation layer:
- technical terms without a natural Nepali equivalent
- proper names (place names, organization names, official titles)
- official/government terminology, where precision matters
- URLs, slugs, and metadata where English improves shareability and SEO discoverability (see WEBSITE_STRUCTURE.md §5)

**MVP does not build a full bilingual publishing system** — articles are not required to be published in both Nepali and English (see MVP_SCOPE.md). English-language articles (e.g. some border/trade stories, or pieces aimed at the diaspora) are published as their own standalone pieces when useful, not as a mandatory second version of every Nepali article. The content model and site architecture stay flexible enough to support fuller bilingual publishing later without rework (see CONTENT_STRATEGY.md §2 and ARTICLE_PAGE_SPEC.md §3 for how a per-article `lang` field supports this).

**Technical requirement:** the site must use correct Unicode Nepali (Devanagari) throughout — not Romanized/transliterated Nepali — and must be designed for genuinely comfortable Nepali reading on small mobile screens (font choice, sizing, and line-height all need to work well for Devanagari, which behaves differently from Latin script — see HOMEPAGE_SPEC.md and ARTICLE_PAGE_SPEC.md for reading-experience specifics).

## 5. Core product principles

1. **Trust over speed.** Every published item is human-reviewed before it goes live. AI can research, draft, and suggest — it does not publish (see AI_CONTENT_WORKFLOW.md).
2. **One person can run this.** Every workflow, tool choice, and feature must be operable by a single part-time editor without a team. This is the single biggest constraint on scope.
3. **Cheap to run, cheap to keep running.** Hosting, tooling, and services should be free or near-free at MVP scale, and should scale in cost roughly with usage/revenue, not scale up-front.
4. **Local identity first.** The site should feel unmistakably "Mechinagar" — not a generic template. Local place names, landmarks, and language matter more than visual polish.
5. **Mobile-first.** Most local readers will read on a phone, often on a slower or shared connection. Performance and mobile layout are not optional polish — they are core requirements.
6. **Don't build what a vendor already does well.** Newsletter delivery, subscriber management, and unsubscribe handling are beehiiv's job, not ours (see NEWSLETTER_STRATEGY.md).
7. **Information platform, not newspaper.** The product should feel like a modern, community-oriented local information hub — clean and useful — not a digitized newspaper. Avoid newspaper-style density, excessive cards, heavy chrome, autoplay media, fake urgency, or clickbait presentation (see HOMEPAGE_SPEC.md §1 for the full list of what to avoid).
8. **Architected to grow without a redesign.** News is the MVP focus, but the information architecture is built so community info, government notices, events, jobs, businesses, and border information can be added as first-class sections later without restructuring the site (see WEBSITE_STRUCTURE.md).
9. **Nepali-first, genuinely readable.** Nepali is the default language throughout, rendered correctly in Unicode and designed for comfortable reading on small mobile screens — not an afterthought bolted onto an English-first design (see §4).

## 6. High-level requirements

### 6.1 MVP requirements (see MVP_SCOPE.md for the definitive list)

- A fast, mobile-first homepage that surfaces the latest and most important local news.
- A "Today's Mechinagar" (आज मेचीनगरमा) daily identity section near the top of the homepage — dynamically dated, showing important local stories and latest updates, with an optional, conditional alert component that only appears when there is a genuine verified public-safety/urgent item (see HOMEPAGE_SPEC.md §2).
- Article pages with clean reading experience, correct metadata, and social sharing.
- A small set of clear categories relevant to Mechinagar, structured so more categories/sections can be added later without redesign (see WEBSITE_STRUCTURE.md).
- Newsletter subscription (powered by beehiiv) embedded on the site.
- SEO fundamentals: correct titles/meta, sitemap, structured data, fast load times.
- A simple, low-friction publishing workflow for one editor (likely a headless CMS or Markdown/Git-based flow — to be decided at implementation time, not in this document).

### 6.2 Explicitly out of scope for MVP

- User accounts / logins / comments requiring accounts.
- Complex editorial dashboards or newsroom software.
- A native mobile app.
- Custom-built email sending/delivery infrastructure — use beehiiv.
- Payment processing / subscriptions / paywalls.
- Autonomous AI agents that research, write, and publish without a human step.

These are excluded because they add cost, maintenance burden, and risk that a one-person operation cannot sustain at launch, and because none of them are necessary to prove the core value proposition: reliable local information, well presented, easy to subscribe to.

## 7. Non-functional requirements

- **Performance:** Core Web Vitals in the "Good" range on mobile (LCP < 2.5s, CLS < 0.1, INP < 200ms) on a typical 3G/4G connection in Nepal.
- **Accessibility:** WCAG 2.1 AA-reasonable baseline — semantic HTML, sufficient color contrast, readable font sizes, keyboard navigability.
- **SEO:** Server-rendered or statically generated pages (Next.js supports both), clean URLs, sitemap.xml, robots.txt, Open Graph and Twitter Card metadata, JSON-LD structured data (NewsArticle/Organization schema) on article pages.
- **Hosting cost:** Should run at effectively $0–$5/month at MVP traffic levels. Two realistic low-cost paths worth evaluating at build time: Vercel (native Next.js support, but the free "Hobby" tier is restricted to non-commercial personal projects) or Cloudflare Pages (free tier explicitly permits commercial use with no bandwidth cap, but Next.js SSR requires an adapter). This is a build-time decision, not decided in this document. [Vercel pricing](https://costbench.com/software/developer-tools/vercel/) · [Cloudflare Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- **Domain:** Nepali residents/registered entities are eligible for a **free `.com.np` domain** via Mercantile Communications, Nepal's ccTLD registrar — a strong low-cost option worth pursuing alongside or instead of a `.com`. [Free .com.np registration guidance](https://webtechnepal.com/supports/free-np-domain-registration-guidelines/) · [Registrar](https://register.com.np/)
- **Maintainability:** A solo, non-full-time developer/editor should be able to publish an article in under 5 minutes and deploy a site change without specialized DevOps knowledge.

## 8. Key decisions and rationale

| Decision | Rationale |
|---|---|
| Newsletter on beehiiv, not custom-built | Email deliverability, unsubscribe compliance, and subscriber analytics are hard and risky to build correctly. beehiiv provides these out of the box for free up to 2,500 subscribers. [Source](https://costbench.com/software/email-marketing/beehiiv/) |
| Nepali-first, not full bilingual | Matches the actual reading language of the target audience and of the primary local sources (municipality office, local Facebook pages), without doubling editorial workload with mandatory parallel English versions. |
| Positioned as a local information platform, not a newspaper | A modern, clean, community-oriented feel builds more trust with a mobile-first audience than a traditional newspaper layout, and better reflects the eventual scope (news + community info + notices + jobs + business + events + border info). |
| Information architecture built for expansion, not rebuilt later | Adding jobs/business/events/notices as first-class sections later should be additive (new routes/categories), not a redesign — this keeps long-term cost low for a one-person operation. |
| "Today's Mechinagar" as a dynamically generated, conditional homepage section | Gives the platform a strong, recognizable daily identity without any fake urgency — the date is generated by the application, and the alert component is hidden whenever there's nothing genuinely verified to show. |
| No user accounts at MVP | Accounts add auth, security, privacy, and moderation burden with no clear MVP benefit — readers don't need an account to read news or subscribe to the newsletter. |
| AI drafts, never publishes | Local news credibility depends on accuracy; unreviewed AI output risks factual errors and reputational damage in a small, tightly-knit community where mistakes are noticed. |
| Static/simple publishing workflow over a custom CMS build | A one-person operation should spend its time on content and community, not building/maintaining admin software. |

## 9. Success signals (directional, not contractual targets)

- Residents recognize Mechinagar Local as a source they check regularly — the kind of site you open to quickly see "what's happening today," not one you visit only when something big happens.
- Newsletter subscriber growth is steady week over week.
- Local businesses and the municipality itself begin sharing Mechinagar Local content or reaching out with information.
- Search visibility for Mechinagar-specific queries (e.g. "मेचीनगर समाचार", "Kakarvitta border news") improves over time.

## 10. Related documents

- WEBSITE_STRUCTURE.md — information architecture and navigation
- CONTENT_STRATEGY.md — categories, content types, sourcing
- HOMEPAGE_SPEC.md / ARTICLE_PAGE_SPEC.md — page-level specs
- NEWSLETTER_STRATEGY.md — beehiiv-based newsletter plan
- AI_CONTENT_WORKFLOW.md — human-in-the-loop AI workflow
- MVP_SCOPE.md — definitive MVP feature list
- SOURCES.md — verified local sources for monitoring
