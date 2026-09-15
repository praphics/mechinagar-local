# Mechinagar Local — Article Page Spec

Status: Draft v2 · Last updated: 2026-08-14

Functional/UX spec for individual article pages. Mobile-first.

## 1. Goals

1. Fast, clean reading experience — the article itself is the product.
2. Clear trust signals: source, date, byline, category.
3. Easy to share (native to how local readers actually share — mainly Facebook/WhatsApp-style sharing in Nepal).
4. Strong SEO per article (this is how most new readers will discover Mechinagar Local via search).
5. Convert readers into newsletter subscribers without being intrusive.
6. Excellent Nepali reading experience by default — most articles are Nepali-first (see §3 and PRODUCT_REQUIREMENTS.md §4), so the reading experience must be designed around Devanagari from the start, not adapted from an English-first template.
7. Clear, factual presentation — no clickbait headline treatment or layout tricks (see HOMEPAGE_SPEC.md §1 for the sitewide "avoid" list, which applies here too).

## 2. Page structure (top to bottom)

1. **Header** (same as sitewide).
2. **Category tag** — links back to the category page.
3. **Headline** (H1) — clear, factual, not clickbait; local place names included where relevant for both clarity and SEO (e.g. "Kakarvitta").
4. **Byline + publish date** (+ "Updated" timestamp if corrected after publishing).
5. **Lead image** (if available) with caption and credit/source.
6. **Article body** — plain, readable typography; short paragraphs; support for embedded quotes, links to sources, and images.
7. **Source attribution block** — if the article draws on an official notice or another outlet, a clear "Source: [Municipality name / outlet name]" line with a link, placed either at the top (for republished announcements) or at the bottom (for original reporting that references sources). **Optional attachment link** — for an official notice where the editor has manually reviewed the original document (e.g. a scanned PDF) and confirmed it's safe to publish (contains no personal information), a clearly-labeled download link to that document renders in the same area, styled consistently with the source block. This is opt-in per article and never automatic — see `public/documents/README.md` for the human-review requirement.
8. **Social share buttons** — placed near the top (after headline/byline) and optionally repeated at the end. Prioritize Facebook and a generic "copy link" / WhatsApp share, given the local audience.
9. **Newsletter subscribe prompt** — a compact inline block after the article body ("Enjoyed this? Get Mechinagar news in your inbox") — secondary to the homepage's main subscribe block, not duplicative or pushy.
10. **Related articles** — 2–3 links, same category or tag, to encourage further reading (helps both engagement and internal SEO linking).
11. **Corrections note** (if applicable) — visible, honest, brief.
12. **Footer** (same as sitewide).

## 3. Metadata requirements (every article)

- `<title>` — headline + site name.
- Meta description — concise 1–2 sentence summary (used by search engines and some social previews).
- Canonical URL.
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type=article`) — critical since sharing will happen heavily on Facebook.
- Twitter Card metadata (low priority for this audience, but cheap to include).
- JSON-LD `NewsArticle` structured data: headline, datePublished, dateModified, author, publisher (Mechinagar Local), image — improves eligibility for Google News-style rich results over time.
- `lang` attribute set correctly per article (`ne` for Nepali content, `en` for English content) — important both for accessibility and for search engines to serve the article to the right audience. **Default assumption is `ne`**, consistent with the Nepali-first policy (see PRODUCT_REQUIREMENTS.md §4) — English articles are the exception, not a parallel version of every Nepali article. This per-article language field is also what keeps the content model flexible enough to support fuller bilingual publishing later (e.g. linking a Nepali article to an English counterpart) without a schema rework — see §4.

## 4. Content model (conceptual — not a schema/implementation)

Each article conceptually needs: title, slug, body, category, language, publish date, updated date (optional), author/byline, source attribution (optional), lead image + alt text + caption (optional), summary/excerpt (used in listings and meta description), status (draft/published), public document attachment (optional — a link + label for a manually-reviewed original document, e.g. an official notice PDF).

This is deliberately described at a conceptual level — the actual data model/CMS choice is an implementation decision for later, not part of this document.

## 5. What's NOT on the MVP article page

- Comments section (moderation burden; see WEBSITE_STRUCTURE.md rationale).
- Reactions/likes/voting widgets.
- Author profile pages/bios (fine as plain text byline until there's more than one contributor).
- Paywall/gated content indicators.
- Auto-playing media of any kind.

## 6. Performance

- Article pages statically generated at build/publish time (or ISR) — no client-side data fetching required to render the core content.
- Lead image optimized/responsive; no layout shift when it loads (reserve space).
- Keep third-party scripts (analytics, share buttons) minimal and non-blocking.

## 7. Accessibility and Nepali readability

- Proper heading hierarchy (one H1, logical H2/H3 use within long articles).
- Images have descriptive alt text (required field in the content model, not optional; alt text follows the article's own language).
- Sufficient contrast and readable default font size (avoid tiny body text — many readers on small/older phone screens).
- Body typography must be tuned for Devanagari script, not just inherited from a Latin-script default: a font with clear rendering of Nepali conjuncts and matras, and generous line-height for comfortable mobile reading (see HOMEPAGE_SPEC.md §9 — the same requirement applies here and should be handled as one shared typography system, not a per-page decision).
- All Unicode Nepali text — never Romanized/transliterated Nepali ("Nepali written in English letters") in article bodies or headlines.
