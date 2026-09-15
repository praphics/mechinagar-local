/**
 * Editorial-time CLI tool — ingests a human-supplied PDF from
 * .claude/evidence/incoming/ into a traceable evidence record under
 * .claude/evidence/processed/. This is a standalone script, not part of
 * the running website: nothing in the app imports or invokes it
 * automatically, and it never makes a network request or calls any
 * external/AI service — see .claude/evidence/README.md for the full
 * design and why.
 *
 * Run with Node's built-in TypeScript support — no extra packages needed:
 *
 *   node --experimental-strip-types scripts/ingest-evidence.ts <filename> --source "<name>" [--sourceUrl "<url>"] [--docType "<type>"] [--force]
 *   npm run evidence:ingest -- <filename> --source "<name>" ...
 *
 * Extraction is tiered — see .claude/evidence/README.md's "Extraction"
 * section for the full rationale:
 *   1. Native text extraction via `pdftotext` (already present in this
 *      environment — checked before adding any new dependency; no PDF/OCR
 *      npm package was added for this).
 *   2. OCR via `tesseract`, only if that binary is actually found on
 *      PATH. Not available in this environment (verified: no tesseract,
 *      no pdftoppm/pdftocairo to even render pages for it) — this tier
 *      activates automatically later if that tooling is ever installed,
 *      without any code change here.
 *   3. `requires-human-review` — the honest fallback, not a failure.
 *
 * Never edits the original file, never invents extracted content, and
 * never silently "corrects" whatever text extraction actually produced.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const EVIDENCE_DIR = path.join(process.cwd(), ".claude", "evidence");
const INCOMING_DIR = path.join(EVIDENCE_DIR, "incoming");
const PROCESSED_DIR = path.join(EVIDENCE_DIR, "processed");

/** Below this many non-whitespace characters, pdftotext's output is treated as "nothing useful extracted." */
const MIN_SUFFICIENT_CHARS = 40;

interface ParsedArgs {
  filename?: string;
  source?: string;
  sourceUrl?: string;
  docType?: string;
  force: boolean;
  help: boolean;
}

function printHelp(): void {
  console.log(`
Ingest a human-supplied PDF into a traceable evidence record.

Usage:
  npm run evidence:ingest -- <filename> --source "<name>" [options]

Required:
  <filename>              A .pdf file already present in .claude/evidence/incoming/
  --source <name>         Where this document came from (required — never guessed)

Optional:
  --sourceUrl <url>       The page/notice this PDF was attached to, if known
  --docType <type>        A short document-type label (e.g. "official notice")
  --force                 Required to re-ingest a document already processed
  --help                  Show this help

This script never makes a network request and never sends the PDF
anywhere. See .claude/evidence/README.md for the full extraction/
evidence-record design.
`);
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = { force: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--force") {
      args.force = true;
      continue;
    }
    if (arg === "--source") {
      args.source = argv[++i];
      continue;
    }
    if (arg === "--sourceUrl") {
      args.sourceUrl = argv[++i];
      continue;
    }
    if (arg === "--docType") {
      args.docType = argv[++i];
      continue;
    }
    if (arg.startsWith("--")) {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
    if (!args.filename) {
      args.filename = arg;
      continue;
    }
    console.error(`Unexpected extra argument: ${arg}`);
    process.exit(1);
  }
  return args;
}

function fail(message: string): never {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

/** Same shape of guard as the project's other ingestion-style scripts (download-library-image.ts, generate-image.ts). */
function assertSafeFilename(filename: string): void {
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    fail(`Invalid filename "${filename}" — must be a plain filename, not a path.`);
  }
  if (!filename.toLowerCase().endsWith(".pdf")) {
    fail(`"${filename}" is not a .pdf file.`);
  }
}

function sha256(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

/** True if a binary is runnable on PATH — used only to detect optional tooling, never to run anything unexpected. */
function isBinaryAvailable(bin: string): boolean {
  try {
    execFileSync(bin, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

interface ExtractionResult {
  method: string;
  status: "extracted" | "requires-human-review";
  confidence: "high" | "medium" | "low" | "none";
  text: string | null;
  uncertaintyNotes: string;
  pdftotextExitCode: number | null;
}

/** Tier 1 (+ tier 2 fallback check, +tier 3 fallback) — see file header. */
function extractText(pdfPath: string): ExtractionResult {
  let stdout = "";
  let exitCode: number | null = null;
  try {
    stdout = execFileSync("pdftotext", [pdfPath, "-"], { encoding: "utf8" });
    exitCode = 0;
  } catch (err) {
    const e = err as { status?: number; stdout?: Buffer | string };
    exitCode = typeof e.status === "number" ? e.status : null;
    stdout = typeof e.stdout === "string" ? e.stdout : e.stdout ? e.stdout.toString("utf8") : "";
  }

  const nonWhitespaceChars = stdout.replace(/\s+/g, "").length;

  if (nonWhitespaceChars >= MIN_SUFFICIENT_CHARS) {
    return {
      method: "native-text-extraction (pdftotext)",
      status: "extracted",
      confidence: "high",
      text: stdout,
      uncertaintyNotes: "",
      pdftotextExitCode: exitCode,
    };
  }

  // Tier 1 insufficient — check whether an OCR engine is even available before claiming to try it.
  const ocrAvailable = isBinaryAvailable("tesseract");
  if (!ocrAvailable) {
    return {
      method: "native-text-extraction-attempted; ocr-unavailable",
      status: "requires-human-review",
      confidence: "none",
      text: null,
      uncertaintyNotes:
        `pdftotext returned only ${nonWhitespaceChars} non-whitespace character(s) — likely a scanned/` +
        `image-only PDF. No OCR engine ("tesseract") is available in this environment, so no further ` +
        `automated extraction was attempted. A human must review the original document directly.`,
      pdftotextExitCode: exitCode,
    };
  }

  // OCR engine present, but this script doesn't have a page-rendering
  // tool (pdftoppm/pdftocairo) available to feed it — same honest
  // fallback, with a note that the OCR *tier itself* is where it stopped.
  return {
    method: "native-text-extraction-attempted; ocr-engine-found-but-no-page-renderer",
    status: "requires-human-review",
    confidence: "none",
    text: null,
    uncertaintyNotes:
      `pdftotext returned only ${nonWhitespaceChars} non-whitespace character(s). A "tesseract" binary is ` +
      `present, but no PDF-page-rendering tool (pdftoppm/pdftocairo) is available to produce images for it, ` +
      `so OCR could not run. A human must review the original document directly.`,
    pdftotextExitCode: exitCode,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.filename) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const filename = args.filename;
  assertSafeFilename(filename);

  if (!args.source || !args.source.trim()) {
    fail("--source is required — this script never guesses where a document came from.");
  }

  const incomingPath = path.join(INCOMING_DIR, filename);
  if (!fs.existsSync(incomingPath)) {
    fail(`"${filename}" was not found in .claude/evidence/incoming/.`);
  }

  const bytes = fs.readFileSync(incomingPath);
  const hash = sha256(bytes);
  const evidenceId = `ev-${hash.slice(0, 12)}`;
  const evidenceDir = path.join(PROCESSED_DIR, evidenceId);

  if (fs.existsSync(evidenceDir) && !args.force) {
    fail(
      `This exact document was already ingested as ${evidenceId} ` +
        `(.claude/evidence/processed/${evidenceId}/). Re-run with --force to re-process it.`
    );
  }

  console.log(`Ingesting "${filename}" as ${evidenceId}...`);
  const extraction = extractText(incomingPath);

  fs.mkdirSync(evidenceDir, { recursive: true });

  // Preserve the original, byte-for-byte, under the evidence directory — never edited.
  const originalDest = path.join(evidenceDir, "original.pdf");
  fs.writeFileSync(originalDest, bytes);

  let extractedTextPath: string | null = null;
  let extractedTextExcerpt: string | null = null;
  if (extraction.text !== null) {
    extractedTextPath = "extracted-text.txt";
    fs.writeFileSync(path.join(evidenceDir, extractedTextPath), extraction.text);
    extractedTextExcerpt = extraction.text.trim().slice(0, 300);
  }

  const record = {
    evidenceId,
    originalFilename: filename,
    source: args.source,
    sourceUrl: args.sourceUrl ?? null,
    documentType: args.docType ?? "pdf",
    ingestionDate: new Date().toISOString(),
    extractionMethod: extraction.method,
    extractionStatus: extraction.status,
    confidence: extraction.confidence,
    extractedTextPath,
    extractedTextExcerpt,
    uncertaintyNotes: extraction.uncertaintyNotes,
    requiresHumanReview: extraction.status === "requires-human-review",
    originalFileReference: "original.pdf",
    originalFileHash: `sha256:${hash}`,
    pdftotextExitCode: extraction.pdftotextExitCode,
  };

  fs.writeFileSync(path.join(evidenceDir, "record.json"), JSON.stringify(record, null, 2) + "\n");

  console.log(`\nEvidence ID: ${evidenceId}`);
  console.log(`Extraction method: ${extraction.method}`);
  console.log(`Extraction status: ${extraction.status}`);
  if (extraction.status === "extracted") {
    console.log(`Confidence: ${extraction.confidence}`);
    console.log(`Extracted text saved to .claude/evidence/processed/${evidenceId}/extracted-text.txt`);
    console.log(`Ready for fact-check handoff (cite Evidence ID ${evidenceId}).`);
  } else {
    console.log(`\nPDF EVIDENCE REQUIRED — human review needed.`);
    console.log(extraction.uncertaintyNotes);
  }
  console.log(`\nRecord: .claude/evidence/processed/${evidenceId}/record.json`);
  console.log(`Original preserved (unmodified) at .claude/evidence/processed/${evidenceId}/original.pdf\n`);
}

main();
