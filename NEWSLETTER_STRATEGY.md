# Mechinagar Local — Newsletter Strategy

Status: Draft v1 · Last updated: 2026-08-14

## 1. Platform decision: beehiiv

Mechinagar Local's newsletter runs entirely on **beehiiv** for subscriber management, email delivery, unsubscribe handling, and subscriber analytics. We do not build any custom email infrastructure — deliverability, spam compliance, and list hygiene are hard problems that a mature vendor already solves.

**Only claim beehiiv features that are independently verified.** The features below are drawn from beehiiv's own help documentation and independent 2026 reviews; anything not listed here should be verified directly in the beehiiv dashboard/docs before being relied on in planning.

## 2. Verified beehiiv capabilities relevant to Mechinagar Local

- **Free tier ("Launch")**: up to 2,500 subscribers, unlimited email sends, a newsletter + basic website/landing pages, and basic analytics. [Source](https://costbench.com/software/email-marketing/beehiiv/)
- **Not available on the free tier**: ad network participation, referral programs, paid/gated subscriptions, advanced automation, and adding team members. [Source](https://costbench.com/software/email-marketing/beehiiv/)
- **Subscriber profile dashboard**: per-subscriber view including geographic location (map pinpoint), acquisition details (how a subscriber was acquired — referral link, recommendation, magic link, social, or specific campaign — with channel/source/medium/device/referring site detail), and tags for segmentation. [Source](https://www.beehiiv.com/support/article/25257855415191-key-features-of-the-subscriber-profile-dashboard)
- **Subscribers Report**: subscriber growth over time, acquisition sources, opens, and click-through rates. [Source](https://www.beehiiv.com/support/article/14492955466007-understanding-your-subscribers-report)
- **Analytics suite**: open rates, click-throughs, subscriber growth, and (on paid plans) revenue tracking and "Verified Clicks" (filtering bot clicks from real ones). [Source](https://www.beehiiv.com/support/article/14492955466007-understanding-your-subscribers-report)
- **Paid plans** (if/when needed): Scale from ~$43/month (annual billing) and Max from ~$96/month (annual billing), both scaling further with subscriber count; Enterprise above 100,000 subscribers. [Source](https://costbench.com/software/email-marketing/beehiiv/)

## 3. What this means for MVP

- Start on the **free Launch plan**. It comfortably supports Mechinagar Local's realistic subscriber count for a long time (2,500 subscribers is a large number for a single-municipality local newsletter at launch).
- **Do not plan on** referral programs, paid/gated newsletter tiers, or advanced automation at MVP — they require a paid plan, and MVP should stay free.
- Subscriber acquisition-source data (available even on the free tier per the subscriber dashboard) is useful for understanding whether growth comes from the website, social shares, or word of mouth — worth checking periodically even without formal reporting infrastructure.

## 4. Website integration

- Embed a beehiiv subscribe form on the homepage (primary placement) and on article pages (secondary, inline prompt) — see HOMEPAGE_SPEC.md and ARTICLE_PAGE_SPEC.md.
- Exact embed mechanism (beehiiv's own hosted embed/iframe vs. API-based custom form) is an implementation decision for build time — beehiiv provides embeddable subscribe forms designed for exactly this use case, but the specific technical approach isn't specified here since this document is scoped to strategy, not code.

## 5. Content and cadence

- **Content**: newsletter issues are built from already-published site articles — republishing/summarizing recent Mechinagar Local stories as a digest, not writing separate newsletter-only content at MVP. This keeps the workload to one editorial pass per story, not two.
- **Cadence**: start with a realistic, sustainable frequency for one person — e.g. weekly — rather than daily. Consistency matters more than frequency for building trust with a new local audience. Revisit cadence once there's a stable flow of articles (see CONTENT_STRATEGY.md §7).
- **Language**: Nepali-primary, matching the site (see CONTENT_STRATEGY.md §2).

## 6. Growth approach (MVP — low-cost, no paid ads)

- Prominent, low-friction subscribe placement on every page (see HOMEPAGE_SPEC.md, ARTICLE_PAGE_SPEC.md).
- Cross-promotion from existing local Facebook community pages/groups where appropriate and permitted (e.g. sharing newsletter issues or article links) — Facebook is the dominant local social platform for this audience.
- Word of mouth and local partnerships (municipality, local businesses) once the outlet has a track record.
- Referral programs and paid growth are explicitly **not** part of MVP (referral programs aren't available on beehiiv's free plan anyway; see §2).

## 7. What's out of scope at MVP

- Paid/gated newsletter tiers.
- Sponsored/advertiser content in the newsletter.
- Multiple newsletter products/segments (e.g. separate "Kakarvitta Border Weekly") — one general newsletter until volume and subscriber data justify segmentation.
- Custom email deliverability, list management, or unsubscribe handling built outside beehiiv.

## 8. Open item to verify before build

Confirm in the live beehiiv product (not just documentation) exactly which embed/integration options are available on the free Launch plan for a custom Next.js site, since some integration features may be plan-gated. This should be checked directly in the beehiiv dashboard at build time rather than assumed from this document.
