/**
 * Server-only: resolves the featuredImage for a NEW article draft —
 * approved image library first, existing category-placeholder convention
 * as the fallback. This only runs when a draft is being created (by me,
 * while writing an article); it is not invoked by the running website and
 * never touches already-published articles.
 */

import { findSuitableLibraryImage } from "./match";
import type { LibraryImageQuery } from "./match";
import { getCategoryBySlug } from "@/lib/data/categories";
import type { ArticleImage } from "@/lib/types";

/**
 * Known limitation (by design — see MVP_SCOPE.md on not building a complex
 * search system yet): the underlying matcher (src/lib/library/match.ts) is
 * weighted tag/category/locality/usage scoring, not semantic or geographic
 * reasoning. An article mentioning the right highway name by a *different*
 * point along it can still score above the match bar even though the
 * photo shows a different specific location. A human editor should still
 * glance at any auto-attached image before publishing — the bar (see
 * DEFAULT_MIN_MATCH_SCORE in match.ts) catches the clear-cut wrong-subject
 * cases, not every subtle one.
 */

export interface DraftImageResult {
  featuredImage: ArticleImage;
  /** "library" = a real approved photograph was used; "placeholder" = no confident match, category SVG used instead. */
  matchedFrom: "library" | "placeholder";
}

/**
 * Called once per new article draft. Never call this for an
 * already-published article — it has no awareness of, and must not
 * override, an existing featuredImage.
 */
export function selectImageForNewDraft(query: LibraryImageQuery): DraftImageResult {
  const match = findSuitableLibraryImage(query);

  if (match) {
    return {
      matchedFrom: "library",
      featuredImage: {
        src: `/images/library/${match.category}/${match.filename}`,
        alt: match.description || match.filename,
        caption: match.creditRequired ? match.creditText : undefined,
        type: match.type,
        usage: match.usage,
      },
    };
  }

  const category = getCategoryBySlug(query.categorySlug);
  return {
    matchedFrom: "placeholder",
    featuredImage: {
      src: `/images/categories/${query.categorySlug}.svg`,
      alt: category ? `${category.nameNe} श्रेणीको प्रतीकात्मक तस्बिर` : "प्रतीकात्मक तस्बिर",
      type: "placeholder",
    },
  };
}
