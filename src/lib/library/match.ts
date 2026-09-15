/**
 * Server-only: ranks the approved image library against an article and
 * explains why. Deliberately not AI-based — a small, auditable weighted
 * score over four signals (see WEIGHTS below), not a black box.
 *
 * Category is a *soft* signal here, not a hard filter (earlier versions of
 * this module filtered candidates to an exact category match first). That
 * changed because good local matches legitimately cross category lines —
 * e.g. an immigration-office photo (library category "government") is the
 * right image for a "kakarvitta-border" article about immigration, and it
 * should outrank a same-category-but-generic photo. Relevance (topic +
 * locality) is what actually decides the winner; category and documentary
 * vs. illustrative usage are smaller nudges layered on top, strong enough
 * to break a near-tie but never enough to override a clearly more
 * relevant image of the "wrong" type (see WEIGHTS' comments).
 *
 * That same softness has a failure mode: category + locality + documentary
 * usage alone can add up to enough points to clear DEFAULT_MIN_MATCH_SCORE
 * with zero real topic overlap — e.g. this previously let the Kakarbhitta
 * immigration-office photo (government, local, documentary) get offered
 * for a ward-9 drainage-cleanup article that has nothing to do with
 * immigration, purely because both are "government" and both are "local."
 * LibraryImageMatch.hasTopicEvidence exists specifically to close that
 * gap: a candidate must have at least one real tag/text overlap with the
 * article to be eligible at all (see scoreImage/findBestLibraryImageMatch)
 * — category, locality, and usage can boost an already-real match, never
 * manufacture one on their own.
 *
 * See public/images/library/manifest.json for the data.
 */

import { getApprovedLibraryImages } from "./manifest";
import { getLocalityTerms } from "@/lib/cityConfig";
import type { LibraryImageRecord } from "./types";

export interface LibraryImageQuery {
  categorySlug: string;
  headline: string;
  tags?: string[];
  summary?: string;
}

export interface LibraryImageMatch {
  image: LibraryImageRecord;
  score: number;
  reason: string;
  /**
   * True only if at least one image tag genuinely overlaps the article's
   * own tags or title/summary text (see scoreTags). This is a hard gate,
   * not just another point in the score: category, locality, and
   * documentary-usage are supporting evidence that can strengthen a real
   * topic match, but — see the "kakarbhitta-immigration-office-01.jpg for
   * a ward drainage-cleanup article" case this was added to fix — they
   * must never be enough to manufacture a match on their own. A candidate
   * with hasTopicEvidence === false is never eligible to be returned by
   * findBestLibraryImageMatch/findSuitableLibraryImage, no matter how high
   * its numeric score is.
   */
  hasTopicEvidence: boolean;
}

/**
 * Below this score, a "match" is really just noise — callers should fall
 * back to the category placeholder rather than accept it. Exported so
 * callers (and the CLI's own duplicate scorer — see
 * scripts/generate-image.ts's header comment on why it can't just import
 * this file) use the same bar. Note this is necessary but not
 * sufficient: hasTopicEvidence must also be true (see LibraryImageMatch).
 */
export const DEFAULT_MIN_MATCH_SCORE = 14;

/**
 * Additive weights, deliberately small relative to topic-match weight —
 * see the module doc comment above for why. Tuned so that:
 *  - a strong topic/tag match dominates regardless of category or usage
 *    (e.g. a genuinely on-topic illustrative image can beat an unrelated
 *    documentary one — "DOCUMENTARY VS ILLUSTRATIVE" ranking preference,
 *    not an absolute exclusion), while
 *  - among images with *similar* topic relevance, an exact category
 *    match, a recognizable local place name, and documentary usage each
 *    add a modest tie-breaking edge, and stack — so a genuinely local
 *    documentary photograph will generally outrank a generic illustrative
 *    one when both are otherwise plausible for the article.
 */
const WEIGHTS = {
  /** Image tag exactly equals one of the article's own tags. */
  tagExact: 12,
  /** Image tag merely appears as a substring of the article's headline/summary. */
  tagSubstring: 4,
  /** image.category === query.categorySlug. */
  categoryMatch: 8,
  /** Any locality term (see getLocalityTerms in @/lib/cityConfig) found in the image's tags/description. */
  locality: 6,
  /** image.usage === "documentary". Illustrative gets no bonus. */
  documentaryUsage: 5,
} as const;

/**
 * Lowercases and treats hyphens/underscores as spaces (collapsing repeats)
 * so tag/text comparisons tolerate punctuation-only variants of the same
 * term — e.g. "नेपाल-भारत सीमा" vs "नेपाल भारत सीमा" — without needing a
 * synonym list or duplicate manifest tags for every spelling variant.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * `localityTerms` comes from the active city's configuration
 * (city-config.json's cityIdentity.localityTerms, via
 * @/lib/cityConfig's getLocalityTerms) — never hard-coded here. A city
 * with no configured locality terms simply never gets this bonus; that's
 * always safe (see getLocalityTerms's own doc comment) — it can only make
 * matching more conservative, never leak another city's terms in.
 */
function hasLocalityMatch(image: LibraryImageRecord, localityTerms: string[]): boolean {
  const haystack = normalize(`${image.tags.join(" ")} ${image.description}`);
  return localityTerms.some((keyword) => haystack.includes(normalize(keyword)));
}

function scoreTags(
  image: LibraryImageRecord,
  queryTags: Set<string>,
  queryText: string
): { score: number; matchedTags: string[] } {
  let score = 0;
  const matchedTags: string[] = [];
  for (const rawTag of image.tags) {
    const tag = normalize(rawTag);
    if (!tag) continue;
    if (queryTags.has(tag)) {
      score += WEIGHTS.tagExact;
      matchedTags.push(rawTag);
    } else if (queryText.includes(tag)) {
      score += WEIGHTS.tagSubstring;
      matchedTags.push(rawTag);
    }
  }
  return { score, matchedTags };
}

function buildReason(params: {
  image: LibraryImageRecord;
  categoryMatch: boolean;
  localityMatch: boolean;
  matchedTags: string[];
  tagScore: number;
}): string {
  const { image, categoryMatch, localityMatch, matchedTags, tagScore } = params;

  const kind = image.usage === "documentary" ? "documentary photograph" : "illustrative image";
  const subject = `Approved ${localityMatch ? "local " : ""}${kind}`;

  const strength = tagScore >= 20 ? "strong" : tagScore > 0 ? "reasonable" : "no topic evidence";

  const signals: string[] = [];
  if (matchedTags.length > 0) signals.push(`${matchedTags.join("/")} tags`);
  if (categoryMatch) signals.push("category");
  if (localityMatch) signals.push("locality");

  const signalText = signals.length > 0 ? ` for ${signals.join(" and ")}` : "";

  const disqualified = tagScore === 0 ? " — category/locality alone is not a match" : "";

  return `${subject}; ${strength} match${signalText}${disqualified}.`;
}

function scoreImage(image: LibraryImageRecord, query: LibraryImageQuery, localityTerms: string[]): LibraryImageMatch {
  const queryTags = new Set((query.tags ?? []).map(normalize));
  const queryText = normalize(`${query.headline} ${query.summary ?? ""}`);

  const { score: tagScore, matchedTags } = scoreTags(image, queryTags, queryText);
  const categoryMatch = image.category === query.categorySlug;
  const localityMatch = hasLocalityMatch(image, localityTerms);
  const isDocumentary = image.usage === "documentary";

  const score =
    tagScore +
    (categoryMatch ? WEIGHTS.categoryMatch : 0) +
    (localityMatch ? WEIGHTS.locality : 0) +
    (isDocumentary ? WEIGHTS.documentaryUsage : 0);

  return {
    image,
    score,
    reason: buildReason({ image, categoryMatch, localityMatch, matchedTags, tagScore }),
    hasTopicEvidence: tagScore > 0,
  };
}

/**
 * Pure — no I/O — so it's directly testable against any candidate list
 * (real or fixture) without touching public/images/library/manifest.json
 * or city-config.json. Only ever call this with already-approved
 * candidates: it has no opinion about approval status, it just scores
 * whatever it's given. `localityTerms` defaults to empty (no locality
 * bonus at all) rather than any specific city's terms — callers that want
 * the active city's terms should get them from
 * @/lib/cityConfig's getLocalityTerms() and pass them in explicitly (see
 * rankLibraryImages below for the real, impure wrapper that does this).
 */
export function rankImages(
  candidates: LibraryImageRecord[],
  query: LibraryImageQuery,
  localityTerms: string[] = []
): LibraryImageMatch[] {
  return candidates.map((image) => scoreImage(image, query, localityTerms)).sort((a, b) => b.score - a.score);
}

/** Same ranking, sourced from the real manifest's approved images and the active city's configured locality terms. */
export function rankLibraryImages(query: LibraryImageQuery): LibraryImageMatch[] {
  return rankImages(getApprovedLibraryImages(), query, getLocalityTerms());
}

/**
 * Returns the best-matching approved library image for an article — with
 * its score and a human-readable reason — or null if nothing clears
 * `minScore`, in which case callers should fall back to the category
 * placeholder.
 */
export function findBestLibraryImageMatch(
  query: LibraryImageQuery,
  minScore: number = DEFAULT_MIN_MATCH_SCORE
): LibraryImageMatch | null {
  const [best] = rankLibraryImages(query);
  if (!best || !best.hasTopicEvidence || best.score < minScore) return null;
  return best;
}

/** Convenience wrapper over findBestLibraryImageMatch for callers that only need the image. */
export function findSuitableLibraryImage(
  query: LibraryImageQuery,
  minScore: number = DEFAULT_MIN_MATCH_SCORE
): LibraryImageRecord | null {
  return findBestLibraryImageMatch(query, minScore)?.image ?? null;
}
