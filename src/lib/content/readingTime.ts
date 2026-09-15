/**
 * Pure, no I/O, no imports — estimates reading time from raw article text.
 * Deliberately self-contained (unlike most of src/lib) so that
 * scripts/build-newsletter.ts can import it directly by relative path even
 * though it's a standalone Node script that can't resolve the "@/" alias —
 * see that script's header comment for why most other src/lib modules
 * can't be imported the same way.
 */

/**
 * Words-per-minute assumption for this site's editorial text (a mix of
 * Nepali and occasional English articles). 200 wpm is the commonly cited
 * average adult silent-reading speed; there's no site-specific data to
 * tune this further yet, so it's a single flat constant rather than a
 * per-language one.
 */
const WORDS_PER_MINUTE = 200;

/** Whitespace-delimited word count — works for both Devanagari and Latin script text. */
function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Always at least 1 minute, even for a very short article — never "0 min read". */
export function estimateReadingMinutes(text: string): number {
  return Math.max(1, Math.ceil(countWords(text) / WORDS_PER_MINUTE));
}
