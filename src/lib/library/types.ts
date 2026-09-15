/**
 * Local, approved image library — public/images/library/ — searched by the
 * article workflow before falling back to a category placeholder (and,
 * later, before generating an AI illustration). See
 * public/images/library/manifest.json for the actual records.
 */

/**
 * Must exactly match the site's article category slugs
 * (src/lib/data/categories.ts) wherever a shared topic exists — those
 * slugs are live public routes with published content, so they win. The
 * border-related slug is "kakarvitta-border", not the more generic
 * "border", because /category/kakarvitta-border is already an indexed
 * route referenced by 4 published articles; this list must not drift from
 * it or the article/image category matcher silently stops matching.
 */
export const LIBRARY_CATEGORIES = [
  "kakarvitta-border",
  "government",
  "agriculture",
  "business",
  "community",
  "infrastructure",
  "education",
  "environment",
  "general",
] as const;

export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

export function isLibraryCategory(value: string): value is LibraryCategory {
  return (LIBRARY_CATEGORIES as readonly string[]).includes(value);
}

/**
 * "photograph" today (Wikimedia/Pexels/Unsplash) — "illustration" reserved
 * for future non-AI stock illustrations. AI-generated images are NOT part
 * of this library/manifest at all: they're generated per-article and
 * referenced directly in that article's featuredImage (type
 * "ai-generated-illustration" on ArticleImage, src/lib/types.ts) via
 * src/lib/ai-image/, never registered here.
 */
export type LibraryImageType = "photograph" | "illustration";

/**
 * "documentary" asserts the image genuinely depicts the real place/event —
 * only ever set by a human reviewer who can vouch for that. "illustrative"
 * is the safe default: a generic, topically-relevant image that must never
 * be presented as proof of a specific event (see EDITORIAL RULE in the
 * image-library spec).
 */
export type LibraryImageUsage = "illustrative" | "documentary";

/**
 * "pending" = not yet reviewed; "rejected" = a human looked and declined it
 * (kept, not deleted, so it can be reconsidered later); "approved" mirrors
 * `approved: true`. Optional because the 19 pre-existing entries predate
 * this field — readers should derive a default from `approved` when it's
 * absent (see deriveReviewStatus in manifest.ts) rather than assume every
 * record has it set.
 */
export type LibraryReviewStatus = "pending" | "approved" | "rejected";

export interface LibraryImageRecord {
  filename: string;
  category: LibraryCategory;
  tags: string[];
  description: string;
  source: string;
  sourceUrl: string;
  author: string;
  license: string;
  creditRequired: boolean;
  creditText: string;
  /**
   * The single field the article matcher checks — true only. Changed only
   * by a human decision, either by hand-editing manifest.json or via the
   * local /review/images dashboard (never automatically by a download or
   * generation script).
   */
  approved: boolean;
  reviewStatus?: LibraryReviewStatus;
  type: LibraryImageType;
  usage: LibraryImageUsage;
}

/**
 * For records predating the `reviewStatus` field — falls back to
 * `approved`. Pure/no I/O, so — unlike the rest of src/lib/library/manifest.ts —
 * this is safe to import from a Client Component (e.g. the review dashboard cards).
 */
export function deriveReviewStatus(image: LibraryImageRecord): LibraryReviewStatus {
  return image.reviewStatus ?? (image.approved ? "approved" : "pending");
}
