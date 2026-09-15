/**
 * Server-only: reads public/images/library/manifest.json via fs. Never
 * import this module from a "use client" component — Node's `fs` module
 * doesn't exist in the browser and this file has no reason to run there.
 */

import fs from "node:fs";
import path from "node:path";
import { isLibraryCategory, type LibraryImageRecord, type LibraryReviewStatus } from "./types";

const MANIFEST_PATH = path.join(process.cwd(), "public", "images", "library", "manifest.json");

export function getLibraryManifest(): LibraryImageRecord[] {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  const raw = fs.readFileSync(MANIFEST_PATH, "utf8").trim();
  if (!raw) return [];

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("public/images/library/manifest.json must contain a JSON array");
  }
  return parsed as LibraryImageRecord[];
}

/** The only images the article workflow is ever allowed to select. */
export function getApprovedLibraryImages(): LibraryImageRecord[] {
  return getLibraryManifest().filter((image) => image.approved === true);
}

function writeLibraryManifest(entries: LibraryImageRecord[]): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

/**
 * The only sanctioned write path into manifest.json outside the download
 * script. Validates (category, filename) against the manifest itself
 * before touching anything — never trusts a caller-supplied path — and
 * mutates only `approved`/`reviewStatus` on the one matching entry,
 * leaving every other field (license, author, sourceUrl, tags, ...)
 * untouched. Throws if no matching entry exists rather than silently
 * creating one.
 */
export function setLibraryImageReviewStatus(
  category: string,
  filename: string,
  status: LibraryReviewStatus
): LibraryImageRecord {
  if (!isLibraryCategory(category)) {
    throw new Error(`Unknown category "${category}"`);
  }
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    throw new Error(`Invalid filename "${filename}"`);
  }

  const manifest = getLibraryManifest();
  const index = manifest.findIndex(
    (image) => image.category === category && image.filename === filename
  );
  if (index === -1) {
    throw new Error(`No manifest entry for ${category}/${filename}`);
  }

  const updated: LibraryImageRecord = {
    ...manifest[index],
    approved: status === "approved",
    reviewStatus: status,
  };
  manifest[index] = updated;
  writeLibraryManifest(manifest);
  return updated;
}
