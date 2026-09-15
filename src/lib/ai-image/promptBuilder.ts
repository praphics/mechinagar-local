/**
 * Server-only: builds the text prompt sent to an AI image provider from
 * article information. Pure/no I/O — model instructions are kept in
 * English (more reliable across providers) while the subject material
 * (title/summary/tags) is passed through in whatever language the article
 * is written in, which for this site is usually Nepali.
 *
 * PROMPT_VERSION is stored on the resulting ArticleImage.promptVersion so a
 * later prompt-wording change is visible per-image rather than silent.
 * Bump it whenever STYLE_RULES or the prompt structure changes.
 */

export const PROMPT_VERSION = "v1";

export interface PromptBuilderInput {
  title: string;
  /** Nepali-facing category name, e.g. "पूर्वाधार" — falls back to the slug if unavailable. */
  category: string;
  summary: string;
  tags?: string[];
  /** Only pass a real, generic place name; omit rather than guess. */
  location?: string;
}

export interface BuiltPrompt {
  prompt: string;
  promptVersion: string;
}

const STYLE_RULES: readonly string[] = [
  "Editorial illustration style, not documentary or photojournalistic photography.",
  "Do not depict any named or identifiable real person.",
  "Do not depict politicians or government officials as real, recognizable individuals.",
  "No fake or real newspaper headlines, banners, or readable text of any kind.",
  "No embedded text, captions, or watermarks rendered into the image itself.",
  "No logos, brand marks, or trademarks.",
  "Do not claim exact real-world geography or a specific identifiable building or location unless a reference image is supplied separately.",
  "Where relevant, use generic eastern Nepal / Terai visual cues (terrain, architecture style, vegetation) rather than a specific real place.",
  "Use visual symbolism appropriate to the article's topic rather than a literal depiction of the reported event.",
  "16:9 landscape composition suitable for a website hero image.",
  "Avoid a photorealistic, documentary-photograph appearance — the result must read clearly as an illustration.",
];

const DEFAULT_LOCATION_HINT = "eastern Nepal / Terai region — generic, not a specific identifiable location";

/**
 * Deterministic given the same input (no randomness, no I/O) so the same
 * article always produces the same prompt text under a given PROMPT_VERSION.
 */
export function buildImagePrompt(input: PromptBuilderInput): BuiltPrompt {
  const tagsLine = input.tags && input.tags.length > 0 ? input.tags.join(", ") : undefined;
  const locationLine = input.location?.trim() || DEFAULT_LOCATION_HINT;

  const subjectLines = [
    `Article title: ${input.title}`,
    `Category: ${input.category}`,
    `Summary: ${input.summary}`,
    tagsLine ? `Tags: ${tagsLine}` : null,
    `Setting: ${locationLine}`,
  ].filter((line): line is string => line !== null);

  const prompt = [
    "Generate a single editorial illustration (not a photograph) for a Nepali local-news website article.",
    "",
    ...subjectLines,
    "",
    "Style and safety requirements:",
    ...STYLE_RULES.map((rule, i) => `${i + 1}. ${rule}`),
  ].join("\n");

  return { prompt, promptVersion: PROMPT_VERSION };
}
