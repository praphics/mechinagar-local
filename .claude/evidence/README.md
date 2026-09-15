# Evidence injection

This is how a human editor supplies an original PDF (a government notice
attachment, a scanned document, etc.) so the local newsroom can process it
as evidence — used when `local-news-research` encounters an attachment it
can't reliably retrieve or read on its own (see that skill's "Attachments"
section and the `EVIDENCE REQUIRED` block it produces).

## Core principle

**Never invent information from an unreadable PDF.** If a supplied
document can't be reliably read, the pipeline preserves that uncertainty
and says so explicitly — it does not guess, and information only enters
fact-checking after the document has actually been processed and read.
See `.claude/skills/local-fact-checker/SKILL.md`'s "Web-source vs.
supplied-PDF evidence" section for how this plays out downstream.

## Directories

```
.claude/evidence/
  incoming/    — drop a PDF here to be ingested. Nothing here has been
                 processed yet; the ingestion script reads from here and
                 never edits a file in place.
  processed/   — one subdirectory per evidence ID, created by ingestion.
                 Contains the preserved original file, extracted text
                 (if any), and the evidence record.
```

Both directories are **outside `public/`** and are never referenced by
any Next.js route — the running website has no way to serve anything
from here, by construction, not by an access-control check. There is no
public upload endpoint and no public evidence directory; see "Security"
below.

Evidence content (`incoming/*` and `processed/*`, everything except this
README and the `.gitkeep` placeholders) is git-ignored — see the
repository's `.gitignore`. Real government notices can contain personal
information (names, citizenship numbers, addresses), so evidence files
should never be committed.

## Ingesting a document

1. Place the PDF in `.claude/evidence/incoming/`.
2. Run:

   ```bash
   npm run evidence:ingest -- <filename> --source "<source name>" [--sourceUrl "<url>"] [--docType "<type>"]
   ```

   `--source` is required — the script has no way to know where a PDF
   came from on its own, and guessing would violate the no-invention
   principle just as much as guessing at its contents would. `--sourceUrl`
   and `--docType` are optional.

3. The script (`scripts/ingest-evidence.ts`) does the following, in order:
   1. Validates the filename (no path traversal, must exist in `incoming/`,
      must be a `.pdf`).
   2. Computes a SHA-256 hash of the file and derives an **evidence ID**
      from it (`ev-<hash prefix>`) — the same document ingested twice
      produces the same ID, so re-ingestion is detected rather than
      silently duplicated (refuses without `--force`, matching this
      project's other scripts' overwrite-safety convention).
   3. Attempts **native PDF text extraction** via `pdftotext` (part of the
      xpdf/poppler toolchain — already present in this environment; no
      new dependency was added for this, see "Extraction" below for why).
   4. Applies a sufficiency check to the extracted text (see "Extraction").
   5. If extraction is insufficient, attempts an **OCR fallback** — but
      only if an OCR engine (`tesseract`) is actually present on the
      system. It is not, in this environment, so this tier currently
      always falls through to step 6. The code path exists and is
      documented so that installing `tesseract` later makes it active
      without any code change.
   6. If still insufficient (or OCR unavailable), marks the document
      **`requires-human-review`** rather than guessing.
   7. Writes the evidence record and preserves the original file
      unmodified under `processed/<evidence-id>/`.

Never edits, re-encodes, or "cleans up" the original PDF — the file under
`processed/<evidence-id>/original.pdf` is byte-identical to what was
dropped in `incoming/` (verified by hash).

## Extraction

**Tier 1 — native text extraction (`pdftotext`).** This project doesn't
have any Node PDF/OCR package installed, and per the task that built this
system ("do not add unnecessary dependencies without first inspecting
what is already available"), the environment was checked first:
`pdftotext` (xpdf tools) is already present, so it's used directly via a
subprocess call — no new npm dependency was added for tier 1.

**Tier 2 — OCR fallback.** Only runs if a `tesseract` binary is found on
`PATH`. Not available in this environment (checked: no `tesseract`, and
no `pdftoppm`/`pdftocairo` page-rendering tool either, so there's nothing
to feed an OCR engine even if one were added). This tier is architecture,
not a promise — it activates automatically once the tooling exists,
without a code change here.

**Tier 3 — human review.** The honest fallback when neither tier produces
reliable text. This is not a failure state; it's the correct, expected
outcome for a scanned/image-only document in an environment with no OCR
installed, and the evidence record says so plainly (`extractionStatus:
"requires-human-review"`).

**Never silently corrects OCR output.** If OCR is ever added, whatever it
outputs is recorded as-is, including ambiguous characters — this system
does not "clean up" a `5` that might be a `6`, a name that might be
misspelled, or a date that might be ambiguous. Preserve it and flag it;
don't resolve it.

## Evidence record

Each processed document gets `processed/<evidence-id>/record.json`:

```json
{
  "evidenceId": "ev-3f9a1c2b8e77",
  "originalFilename": "notice-example.pdf",
  "source": "Mechinagar Municipality",
  "sourceUrl": "https://example.gov.np/notice/...",
  "documentType": "pdf",
  "ingestionDate": "2026-08-16T10:00:00.000Z",
  "extractionMethod": "native-text-extraction (pdftotext)",
  "extractionStatus": "extracted",
  "confidence": "high",
  "extractedTextPath": "extracted-text.txt",
  "extractedTextExcerpt": "first ~300 characters of the extracted text...",
  "uncertaintyNotes": "",
  "requiresHumanReview": false,
  "originalFileReference": "original.pdf",
  "originalFileHash": "sha256:...",
  "pdftotextExitCode": 0
}
```

When extraction is insufficient, `extractionStatus` is
`"requires-human-review"`, `extractedTextPath`/`extractedTextExcerpt` are
`null`, and `uncertaintyNotes` explains exactly what's missing and why
(e.g. "pdftotext returned 0 characters of extractable text — likely a
scanned/image-only PDF; no OCR engine is available in this environment").

## Auditability

Every claim that traces back to an injected PDF should be traceable in
one direction: **Evidence ID → document (`processed/<id>/original.pdf`)
→ extraction method (the record's `extractionMethod`) → extracted
evidence (`extracted-text.txt` / the record's excerpt)**. A fact-check
claim citing PDF evidence should name the Evidence ID, not just "the
PDF" — see `local-fact-checker/SKILL.md`.

## Fact-check integration

`local-fact-checker` distinguishes two kinds of evidence: **web-source**
(a fetched page, as before) and **supplied-PDF** (an evidence record from
this system). A claim may only be strengthened by supplied-PDF evidence
when that evidence record's `extractionStatus` is `"extracted"` — a
`"requires-human-review"` record is treated exactly like an unreadable
attachment (UNVERIFIED, flagged), never as if it were readable.

## Security

- No public upload endpoint — ingestion is a local CLI script, run
  explicitly by a human, never triggered by the running website.
- No public evidence directory — `.claude/evidence/` is outside `public/`
  and outside `src/`; nothing in the Next.js app can serve it.
- No API key required — `pdftotext` is a local subprocess call.
- No automatic external upload — nothing in this system makes a network
  request. Ever.
- Supplied PDFs are never sent to any external AI service. If that's
  wanted later (e.g. an AI-assisted OCR/summarization pass), that's a
  separate, explicitly authorized future task — not something this
  system does now or defaults to.
- This system never changes an article's `status`, never publishes,
  never generates an image, and never sends a newsletter. It only
  produces evidence records for `local-fact-checker`/`local-article-writer`
  to use.
