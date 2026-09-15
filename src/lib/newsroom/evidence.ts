/**
 * Server-only, read-only: reads .claude/evidence/processed/<id>/record.json
 * — the same records scripts/ingest-evidence.ts produces. Used only by the
 * dev-only /newsroom dashboard (src/app/newsroom/[slug]/page.tsx) to show
 * a linked evidence record's provenance next to a link to the PDF itself
 * (src/app/api/newsroom/evidence/[id]/route.ts). Never writes anything —
 * all evidence mutation happens exclusively through
 * scripts/ingest-evidence.ts; see .claude/evidence/README.md.
 */

import fs from "node:fs";
import path from "node:path";

const EVIDENCE_PROCESSED_DIR = path.join(process.cwd(), ".claude", "evidence", "processed");

export interface EvidenceRecord {
  evidenceId: string;
  originalFilename: string;
  source: string;
  sourceUrl: string | null;
  documentType: string;
  ingestionDate: string;
  extractionMethod: string;
  extractionStatus: "extracted" | "requires-human-review";
  confidence: "high" | "medium" | "low" | "none";
  extractedTextPath: string | null;
  extractedTextExcerpt: string | null;
  uncertaintyNotes: string;
  requiresHumanReview: boolean;
  originalFileReference: string;
  originalFileHash: string;
  pdftotextExitCode: number | null;
}

/**
 * Evidence IDs are always exactly `ev-` + a lowercase hex hash prefix (see
 * scripts/ingest-evidence.ts). Both getEvidenceRecord below and the
 * evidence-serving API route validate against this before building any
 * file path from caller input — same discipline as
 * setLibraryImageReviewStatus's filename validation in
 * src/lib/library/manifest.ts.
 */
export function isValidEvidenceId(id: string): boolean {
  return /^ev-[0-9a-f]+$/.test(id);
}

export function getEvidenceRecord(evidenceId: string): EvidenceRecord | null {
  if (!isValidEvidenceId(evidenceId)) return null;
  const recordPath = path.join(EVIDENCE_PROCESSED_DIR, evidenceId, "record.json");
  if (!fs.existsSync(recordPath)) return null;
  const raw = fs.readFileSync(recordPath, "utf8").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EvidenceRecord;
  } catch {
    return null;
  }
}
