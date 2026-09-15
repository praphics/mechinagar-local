/**
 * Server-only: turns a GeneratedImage + article context into the
 * ArticleImage shape stored in featuredImage frontmatter, with the
 * mandatory editorial disclosure caption attached. This is the one place
 * that decides what an AI-generated image's caption says — never build
 * this object by hand elsewhere, so the disclosure can't be forgotten.
 *
 * Note for scripts/generate-image.ts: that CLI runs as a standalone Node
 * script via `node --experimental-strip-types` and can't resolve the "@/"
 * path alias (see scripts/download-library-image.ts's file header for the
 * same constraint), so it duplicates this logic in-file rather than
 * importing it. Keep the two in sync if this changes.
 */

import type { ArticleImage } from "@/lib/types";
import type { GeneratedImage } from "./provider";

/**
 * Required visible disclosure for every AI-generated illustration (see
 * ARTICLE_PAGE_SPEC.md's figcaption rendering of featuredImage.caption).
 * Must never be replaced with wording that implies a real photograph.
 */
export const AI_ILLUSTRATION_DISCLOSURE = "AI-generated illustration — प्रतीकात्मक तस्बिर";

export interface AiIllustrationFeaturedImageInput {
  src: string;
  alt: string;
  image: GeneratedImage;
}

export function buildAiIllustrationFeaturedImage({
  src,
  alt,
  image,
}: AiIllustrationFeaturedImageInput): ArticleImage {
  return {
    src,
    alt,
    caption: AI_ILLUSTRATION_DISCLOSURE,
    type: "ai-generated-illustration",
    usage: "illustrative",
    generatedAt: image.generatedAt,
    provider: image.provider,
    promptVersion: image.promptVersion,
  };
}
