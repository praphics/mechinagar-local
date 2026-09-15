/**
 * Server-only, read-only: derives a human-readable provenance explanation
 * for an article's featuredImage, for the /newsroom review UI. Cross-
 * references public/images/library/manifest.json (via src/lib/library/
 * manifest.ts) for "photograph" images — the same src convention
 * src/lib/library/draftImage.ts writes (`/images/library/{category}/
 * {filename}`) — so a library-sourced photo shows its real source/license/
 * author rather than a guess. Never writes anything.
 */

import type { ArticleImage } from "@/lib/types";
import { getLibraryManifest } from "@/lib/library/manifest";

export interface ImageProvenance {
  type: string;
  usage: string;
  /** True when this image must be disclosed as not a documentary photo of the actual event (illustrative stock photo or AI-generated). */
  disclosureRequired: boolean;
  provenance: string;
}

const LIBRARY_SRC_PATTERN = /^\/images\/library\/([^/]+)\/([^/]+)$/;

export function describeImageProvenance(image: ArticleImage | undefined): ImageProvenance | null {
  if (!image) return null;

  const type = image.type ?? "unspecified";
  const usage = image.usage ?? "unspecified";
  const disclosureRequired = image.usage === "illustrative" || type === "ai-generated-illustration";

  if (type === "placeholder") {
    return {
      type,
      usage,
      disclosureRequired: true,
      provenance: "Category placeholder graphic — not a photograph, not tied to this specific event.",
    };
  }

  if (type === "ai-generated-illustration") {
    return {
      type,
      usage,
      disclosureRequired: true,
      provenance: `AI-generated illustration — provider: ${image.provider ?? "(not recorded)"}, generated: ${image.generatedAt ?? "(not recorded)"}, prompt version: ${image.promptVersion ?? "(not recorded)"}. Must never be presented as a real photograph.`,
    };
  }

  if (type === "photograph") {
    const match = image.src.match(LIBRARY_SRC_PATTERN);
    if (match) {
      const [, category, filename] = match;
      const record = getLibraryManifest().find((r) => r.category === category && r.filename === filename);
      if (record) {
        return {
          type,
          usage,
          disclosureRequired,
          provenance: `Library photograph — source: ${record.source}, author: ${record.author}, license: ${record.license}${record.creditRequired ? ` (credit required: "${record.creditText}")` : ""}. Usage: ${record.usage === "documentary" ? "documentary — verified to depict this actual event/place" : "illustrative — generically relevant, not verified as this specific event"}.`,
        };
      }
    }
    return {
      type,
      usage,
      disclosureRequired,
      provenance: "Photograph — no matching library manifest entry found for this src (may predate the library system or use a non-standard path).",
    };
  }

  return {
    type,
    usage,
    disclosureRequired,
    provenance: "Image type not specified in article frontmatter.",
  };
}
