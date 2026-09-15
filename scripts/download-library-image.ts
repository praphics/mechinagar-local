/**
 * Editorial-time CLI tool — downloads one image and registers it in the
 * local approved-image library (public/images/library/). This is a
 * standalone script, not part of the running website: it never runs during
 * `npm run dev`, `next build`, or `next start`. Nothing in the app imports
 * or invokes it automatically.
 *
 * Run with Node's built-in TypeScript support — no extra packages needed:
 *
 *   node --experimental-strip-types scripts/download-library-image.ts [options]
 *   npm run library:download -- [options]
 *
 * This script NEVER marks an image "approved". Approval is always a
 * separate, deliberate step: a human checks the license and the image
 * content, then hand-edits "approved": true in
 * public/images/library/manifest.json.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Must exactly match LIBRARY_CATEGORIES in src/lib/library/types.ts — kept
// as a separate literal here because this script runs standalone via Node
// and can't use the "@/" import alias. The border slug is
// "kakarvitta-border", matching the site's existing public category route,
// not the more generic "border" — see that file's comment for why.
const LIBRARY_CATEGORIES = [
  "kakarvitta-border",
  "government",
  "agriculture",
  "business",
  "community",
  "infrastructure",
  "education",
  "environment",
  "general",
] as const;
type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

interface LibraryImageRecord {
  filename: string;
  category: LibraryCategory;
  tags: string[];
  description: string;
  source: string;
  sourceUrl: string;
  author: string;
  license: string;
  creditRequired: boolean;
  creditText: string;
  approved: boolean;
  type: "photograph" | "illustration";
  usage: "illustrative" | "documentary";
}

const LIBRARY_DIR = path.join(process.cwd(), "public", "images", "library");
const MANIFEST_PATH = path.join(LIBRARY_DIR, "manifest.json");

function printHelp(): void {
  console.log(`
Download and register an image into the local approved-image library.

Required:
  --url <url>            https://... to download, or file://... for local testing
  --category <name>      One of: ${LIBRARY_CATEGORIES.join(", ")}
  --filename <name>      Destination filename, e.g. kakarvitta-gate.jpg
  --source <name>        Human-readable source name, e.g. "Wikimedia Commons"
  --sourceUrl <url>      Page a human can visit to verify license/credit
  --license <text>       e.g. "CC BY-SA 4.0", "Pexels License" (required — no license, no download)

Recommended:
  --author <name>              Photographer/creator name, if known
  --description <text>         Short description of the image
  --tags <a,b,c>                Comma-separated tags
  --creditRequired               Set if the license requires attribution
  --creditText <text>            Exact credit line to display if required
  --type <photograph|illustration>   Default: photograph
  --usage <illustrative|documentary> Default: illustrative — only use
                                      "documentary" if you can personally
                                      vouch this is a real local photo of
                                      the actual place/event.

Safety:
  --force                 Required to overwrite an existing file or manifest entry

Images are NEVER marked approved automatically. After this script finishes,
review the license and content yourself, then hand-edit
"approved": true for that entry in public/images/library/manifest.json.
`);
}

interface ParsedArgs {
  url?: string;
  category?: string;
  filename?: string;
  source?: string;
  sourceUrl?: string;
  license?: string;
  author?: string;
  description?: string;
  tags?: string;
  creditRequired: boolean;
  creditText?: string;
  type?: string;
  usage?: string;
  force: boolean;
  help: boolean;
}

const VALUE_FLAGS = [
  "url", "category", "filename", "source", "sourceUrl", "license",
  "author", "description", "tags", "creditText", "type", "usage",
] as const;

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = { creditRequired: false, force: false, help: false };
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
    if (arg === "--creditRequired") {
      args.creditRequired = true;
      continue;
    }
    const flagName = arg.startsWith("--") ? arg.slice(2) : null;
    if (flagName && (VALUE_FLAGS as readonly string[]).includes(flagName)) {
      (args as unknown as Record<string, string | undefined>)[flagName] = argv[++i];
      continue;
    }
    console.error(`Unknown argument: ${arg}`);
    process.exit(1);
  }
  return args;
}

function fail(message: string): never {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

/**
 * Magic-byte sniffing — a Content-Type header can lie (or, for file://
 * sources used in local testing, won't exist at all), so this is the
 * actual "is this really an image" check.
 */
function detectImageType(bytes: Buffer): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (bytes.toString("ascii", 0, 3) === "GIF") return "gif";
  return null;
}

/** Node's built-in fetch doesn't support file:// yet, so branch on scheme. */
async function fetchBytes(url: string): Promise<{ bytes: Buffer; contentType: string | null }> {
  if (url.startsWith("file://")) {
    const filePath = fileURLToPath(url);
    const bytes = fs.readFileSync(filePath);
    return { bytes, contentType: null };
  }
  const res = await fetch(url);
  if (!res.ok) fail(`Download failed: HTTP ${res.status} ${res.statusText}`);
  const contentType = res.headers.get("content-type");
  const bytes = Buffer.from(await res.arrayBuffer());
  return { bytes, contentType };
}

function readManifest(): LibraryImageRecord[] {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  const raw = fs.readFileSync(MANIFEST_PATH, "utf8").trim();
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) fail("manifest.json must contain a JSON array");
  return parsed as LibraryImageRecord[];
}

function writeManifest(entries: LibraryImageRecord[]): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || process.argv.length <= 2) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const required: Array<[keyof ParsedArgs, string]> = [
    ["url", "--url"],
    ["category", "--category"],
    ["filename", "--filename"],
    ["source", "--source"],
    ["sourceUrl", "--sourceUrl"],
    ["license", "--license"],
  ];
  for (const [key, flag] of required) {
    if (!args[key]) fail(`${flag} is required. Run with --help for usage.`);
  }

  const category = args.category!;
  if (!(LIBRARY_CATEGORIES as readonly string[]).includes(category)) {
    fail(`--category must be one of: ${LIBRARY_CATEGORIES.join(", ")}`);
  }

  const filename = args.filename!;
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    fail(`--filename must be a plain filename, not a path (got "${filename}")`);
  }

  // License safety gate — the single most important rule in this script.
  if (!args.license || !args.license.trim()) {
    fail("Refusing to download: no license information provided (--license is required).");
  }

  const destPath = path.join(LIBRARY_DIR, category, filename);
  if (fs.existsSync(destPath) && !args.force) {
    fail(`"${filename}" already exists in ${category}/. Re-run with --force to overwrite.`);
  }

  console.log(`Fetching ${args.url} ...`);
  const { bytes, contentType } = await fetchBytes(args.url!);
  console.log(`Got ${bytes.length} bytes${contentType ? ` (Content-Type: ${contentType})` : ""}`);

  const detected = detectImageType(bytes);
  if (!detected) {
    fail("Content does not look like a valid image (jpeg/png/webp/gif) — refusing to save.");
  }
  console.log(`Verified image format: ${detected}`);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, bytes);
  console.log(`Saved to public/images/library/${category}/${filename}`);

  const manifest = readManifest();
  const existingIndex = manifest.findIndex(
    (entry) => entry.filename === filename && entry.category === category
  );
  if (existingIndex >= 0 && !args.force) {
    fail(
      `A manifest entry for ${category}/${filename} already exists. Re-run with --force to update it.`
    );
  }

  const entry: LibraryImageRecord = {
    filename,
    category: category as LibraryCategory,
    tags: args.tags ? args.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    description: args.description ?? "",
    source: args.source!,
    sourceUrl: args.sourceUrl!,
    author: args.author ?? "",
    license: args.license!,
    creditRequired: args.creditRequired,
    creditText: args.creditText ?? "",
    approved: false, // never set true automatically — see file header
    type: args.type === "illustration" ? "illustration" : "photograph",
    usage: args.usage === "documentary" ? "documentary" : "illustrative",
  };

  if (existingIndex >= 0) {
    manifest[existingIndex] = entry;
    console.log("Updated existing manifest entry.");
  } else {
    manifest.push(entry);
    console.log("Created new manifest entry.");
  }
  writeManifest(manifest);

  console.log(`\nDone. approved: false — review the license and image content, then`);
  console.log(`hand-edit "approved": true in public/images/library/manifest.json when ready.\n`);
}

main();
