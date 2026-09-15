/**
 * Reuse-validation CLI — fails if a forbidden city-specific string
 * appears in reusable-engine code. Produced by the Phase 9 multi-city
 * reusability test (2026-08-17) as the "automated reuse validation"
 * deliverable. Read-only: never modifies any file.
 *
 * Run with Node's built-in TypeScript support:
 *
 *   node --experimental-strip-types scripts/check-city-agnostic.ts
 *   npm run check:city-agnostic
 *
 * Scope: .claude/skills/, src/lib/, src/app/newsroom/, scripts/ — the
 * newsroom ENGINE (Skills, workflow, schema, fact-checking, image
 * editorial, newsletter generation, Beehiiv integration, editorial
 * dashboard), matching Phase 9's own "target architecture" list. It
 * deliberately does NOT scan:
 *
 *   - content/                  (this city's own articles/newsletters)
 *   - public/                   (this city's own images/manifest)
 *   - .claude/city-config.json and .claude/city-config.README.md
 *   - .tmp/                     (disposable test fixtures)
 *   - *.md documentation that explicitly discusses THIS project's current
 *     city as history/example (this file, README.md,
 *     PRODUCT_REQUIREMENTS.md, SOURCES.md, .claude/*.README.md)
 *   - src/lib/data/categories.ts — deliberately project-schema, not
 *     city-config, per an existing pre-Phase-9 architectural decision
 *     (see DEPLOYING-A-NEW-CITY.md's "Changes required for a new city").
 *     A new city edits this file directly, the same way it edits any
 *     other project code — flagging it here would be permanent noise.
 *   - src/app/ OUTSIDE src/app/newsroom/, and src/components/ — the
 *     PUBLIC MARKETING SITE (Header, Footer, homepage, about/submit/
 *     search/newsletter-signup pages, site-config.ts). Phase 9's
 *     hardcoding audit found this presentation layer genuinely hardcodes
 *     Mechinagar branding/copy and is NOT yet config-driven — a real,
 *     separate limitation, documented in DEPLOYING-A-NEW-CITY.md's
 *     "Changes required for a new city," deliberately out of THIS
 *     checker's scope (which tracks the newsroom engine, per Phase 9
 *     section 1's target architecture) rather than silently included and
 *     permanently red, or silently excluded and undocumented.
 *
 * This checker only looks at .ts/.tsx files within its scanned roots and
 * only flags the current deployment's own city-specific terms (see
 * FORBIDDEN_TERMS) — it is intentionally narrow, not a general profanity/
 * secrets scanner. A different deployment reusing this script should
 * update FORBIDDEN_TERMS to match ITS OWN previous city if migrating
 * away from one.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const SCAN_ROOTS = [
  ".claude/skills",
  "src/lib",
  "src/app/newsroom",
  "scripts",
];

// Files/dirs inside SCAN_ROOTS that are still legitimate to contain the
// term (documented, project-schema exceptions — see header comment).
const PATH_EXCLUSIONS = [
  "src/lib/data/categories.ts",
  // Public-site newsletter-signup widget copy — presentation layer, not
  // engine logic; physically under src/lib/data/ but same bucket as
  // Header.tsx/Footer.tsx/site-config.ts (see header comment).
  "src/lib/data/newsletter.ts",
  // The public site's own top-level branding object (name/url/meta
  // description) — same public-site-chrome bucket as the above, just
  // physically under src/lib/ rather than src/components/.
  "src/lib/site-config.ts",
  // This checker's own FORBIDDEN_TERMS list necessarily contains the
  // literal terms it searches for — excluding itself, not the terms.
  "scripts/check-city-agnostic.ts",
];

// Exact trimmed line content that is a known, already-accepted exception:
// the src/lib/data/categories.ts "kakarvitta-border" category slug/label
// MIRRORED (not redefined) into a few other project-schema locations
// (LIBRARY_CATEGORIES, CATEGORY_LABELS_NE, a CLI help-text example) — see
// header comment on why categories.ts itself is excluded. Narrow and
// exact-match on purpose, so this can never accidentally swallow an
// unrelated real hardcoded value that merely shares a line number.
const LINE_EXCLUSIONS = new Set([
  '"kakarvitta-border",',
  '"kakarvitta-border": "काकरभिट्टा सीमा",',
  "--filename <name>      Destination filename, e.g. kakarvitta-gate.jpg",
]);

const SCAN_EXTENSIONS = [".ts", ".tsx"];

const FORBIDDEN_TERMS = [
  "mechinagar",
  "मेचीनगर",
  "jhapa",
  "झापा",
  "kakarbhitta",
  "kakarvitta",
  "काकरभिट्टा",
  "काँकरभिट्टा",
];

interface Finding {
  file: string;
  line: number;
  term: string;
  text: string;
}

function walk(dir: string, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, results);
    } else if (SCAN_EXTENSIONS.includes(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

function isExcluded(relPath: string): boolean {
  const normalized = relPath.split(path.sep).join("/");
  return PATH_EXCLUSIONS.some((ex) => normalized === ex);
}

function scanFile(filePath: string): Finding[] {
  const findings: Finding[] = [];
  const relPath = path.relative(ROOT, filePath);
  if (isExcluded(relPath)) return findings;

  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    // Comments (JSDoc/block-comment interior lines and `//` lines) are
    // documentation/history, not a functional engine dependency — see
    // this project's own established pattern of documenting past bugs
    // (e.g. Milestone 6E) by name in comments without that being a
    // reusability defect. Real code on the same line as `//` (rare in
    // this codebase's style) would still be caught on its own line.
    if (trimmed.startsWith("*") || trimmed.startsWith("//")) return;
    if (LINE_EXCLUSIONS.has(trimmed)) return;

    const lower = line.toLowerCase();
    for (const term of FORBIDDEN_TERMS) {
      if (lower.includes(term.toLowerCase())) {
        findings.push({ file: relPath, line: i + 1, term, text: trimmed.slice(0, 160) });
      }
    }
  });
  return findings;
}

function main(): void {
  const allFindings: Finding[] = [];
  for (const scanRoot of SCAN_ROOTS) {
    const files = walk(path.join(ROOT, scanRoot));
    for (const file of files) {
      allFindings.push(...scanFile(file));
    }
  }

  if (allFindings.length === 0) {
    console.log(
      `\nOK — no forbidden city-specific terms found in real code under ${SCAN_ROOTS.join(", ")}.\n` +
        `(Excluded: content/, public/, .claude/city-config.json, .tmp/, documentation, ` +
        `comment lines, ${PATH_EXCLUSIONS.filter((p) => p !== "scripts/check-city-agnostic.ts").join(", ")}, ` +
        `and ${LINE_EXCLUSIONS.size} documented category-schema-mirror line(s) — see this script's header comment for why.)\n`
    );
    process.exit(0);
  }

  console.error(`\n${allFindings.length} forbidden city-specific reference(s) found in reusable-engine code:\n`);
  for (const f of allFindings) {
    console.error(`  ${f.file}:${f.line}  [${f.term}]  ${f.text}`);
  }
  console.error(
    "\nThese locations are reusable newsroom-engine code per this project's own " +
      `architecture (${SCAN_ROOTS.join(" / ")}) — a hard-coded city term in real code ` +
      "here (not a comment) means a future second-city deployment would silently show " +
      "the wrong city's data. Move the value into .claude/city-config.json (or, for the " +
      "article category schema, src/lib/data/categories.ts) instead.\n"
  );
  process.exit(1);
}

main();
