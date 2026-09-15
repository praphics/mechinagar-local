/**
 * Editorial-time CLI tool — the explicit, human-invoked trigger for the AI
 * illustration fallback. This is a standalone script, not part of the
 * running website: nothing in the app imports or invokes it automatically,
 * and the article workflow must never call an image provider on its own
 * (see src/lib/library/draftImage.ts, which only ever resolves to an
 * approved library photo or the category placeholder SVG).
 *
 * Run with Node's built-in TypeScript support — no extra packages needed:
 *
 *   node --experimental-strip-types --env-file-if-exists=.env.local scripts/generate-image.ts <slug> [options]
 *   npm run generate:image -- <slug> [options]
 *
 * --env-file-if-exists=.env.local is how this standalone script reads
 * OPENAI_API_KEY: Next.js auto-loads .env.local for the running app, but a
 * plain `node` process doesn't, so the npm script passes this flag
 * explicitly (see package.json). Nothing is required to run the default
 * mock provider, which never reads any key.
 *
 * This script duplicates a handful of small definitions that also exist as
 * proper modules under src/lib/ai-image/ and src/lib/library/ (prompt
 * rules, provider calls, manifest matching, the AI disclosure caption) —
 * same reason and same pattern as scripts/download-library-image.ts: this
 * script runs standalone via Node and can't resolve the "@/" path alias or
 * the extensionless relative imports those modules use internally for
 * Next.js's bundler. See src/lib/ai-image/*.ts and
 * src/lib/library/match.ts for the canonical, Next.js-importable versions
 * — keep both in sync if you change one (in particular: the library-match
 * scoring below mirrors src/lib/library/match.ts's WEIGHTS/
 * DEFAULT_MIN_MATCH_SCORE exactly; if that file's weights change, update
 * this copy too).
 *
 * Provider support: "mock" (default, never touches the network) and
 * "openai" (real gpt-image-2 calls, requires OPENAI_API_KEY, costs money —
 * only runs when explicitly requested with --provider openai). "gemini" is
 * recognized but intentionally not implemented.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");
const LIBRARY_MANIFEST_PATH = path.join(process.cwd(), "public", "images", "library", "manifest.json");
const ARTICLES_IMAGE_DIR = path.join(process.cwd(), "public", "images", "articles");
const CITY_CONFIG_PATH = path.join(process.cwd(), ".claude", "city-config.json");

// Mirrors src/lib/library/match.ts's WEIGHTS/DEFAULT_MIN_MATCH_SCORE.
const WEIGHTS = { tagExact: 12, tagSubstring: 4, categoryMatch: 8, locality: 6, documentaryUsage: 5 } as const;
const DEFAULT_MIN_MATCH_SCORE = 14;

/**
 * Mirrors src/lib/cityConfig.ts's getLocalityTerms() — reads the active
 * city's locality terms from city-config.json rather than hard-coding a
 * specific city's place names (this used to be a hardcoded
 * LOCALITY_KEYWORDS constant; see Milestone 6E.1). Falls back to an empty
 * array, never to another city's terms, if the config is missing or
 * doesn't define this field — that only makes matching more conservative.
 */
function getLocalityTerms(): string[] {
  if (!fs.existsSync(CITY_CONFIG_PATH)) return [];
  const raw = fs.readFileSync(CITY_CONFIG_PATH, "utf8").trim();
  if (!raw) return [];
  let config: unknown;
  try {
    config = JSON.parse(raw);
  } catch {
    return [];
  }
  const cityIdentity = (config as Record<string, unknown>)?.cityIdentity as Record<string, unknown> | undefined;
  const terms = cityIdentity?.localityTerms;
  return Array.isArray(terms) ? terms.filter((t): t is string => typeof t === "string") : [];
}

// Mirrors src/lib/ai-image/promptBuilder.ts — bump both together.
const PROMPT_VERSION = "v1";
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

// Mirrors src/lib/ai-image/metadata.ts's AI_ILLUSTRATION_DISCLOSURE.
const AI_ILLUSTRATION_DISCLOSURE = "AI-generated illustration — प्रतीकात्मक तस्बिर";

// 1x1 transparent PNG — mirrors src/lib/ai-image/providers/mockProvider.ts.
// A deterministic fixture, not a generated image; never a network call.
const MOCK_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

// Mirrors src/lib/ai-image/providers/openaiProvider.ts — see that file's
// header comment for the docs this was confirmed against.
const OPENAI_IMAGES_ENDPOINT = "https://api.openai.com/v1/images/generations";
const OPENAI_MODEL = "gpt-image-2";
const OPENAI_SIZE = "2048x1152"; // exact 16:9
const OPENAI_QUALITY = "low"; // cheapest tier

interface ArticleFrontmatter {
  title: string;
  slug: string;
  category: string;
  language: string;
  summary: string;
  status: string;
  tags: string[];
}

interface LibraryImageRecord {
  filename: string;
  category: string;
  tags: string[];
  description: string;
  approved: boolean;
  usage: string;
}

interface ParsedArgs {
  slug?: string;
  provider: string;
  force: boolean;
  help: boolean;
}

function printHelp(): void {
  console.log(`
Generate (or refuse to generate) an AI illustration fallback for a draft article.

Usage:
  npm run generate:image -- <slug> [options]

Required:
  <slug>                 The article's frontmatter "slug" (not necessarily the filename)

Options:
  --provider <name>      "mock" (default, no network call) or "openai" (real
                          gpt-image-2 call — costs money, requires
                          OPENAI_API_KEY in .env.local). "gemini" is
                          recognized but intentionally not implemented.
  --force                 Required to overwrite an existing image file at the destination
  --help                  Show this help

Behavior:
  1. Loads the article by slug from content/articles/*.md.
  2. Refuses unless the article's status is "draft".
  3. Checks the approved image library for that article's category — if a
     confident match exists, STOPS and tells you to use it instead.
  4. Otherwise builds a prompt and calls the configured provider.
  5. Saves the image under public/images/articles/ and updates ONLY the
     article's featuredImage frontmatter field. Nothing else in the file
     (status, title, category, content, source, publishedAt, ...) is touched.

The mock provider never calls a network API or reads a key. The openai
provider makes exactly one request per run — no automatic retries — and
only when you pass --provider openai explicitly.
`);
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = { provider: "mock", force: false, help: false };
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
    if (arg === "--provider") {
      args.provider = argv[++i] ?? "";
      continue;
    }
    if (arg.startsWith("--")) {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
    if (!args.slug) {
      args.slug = arg;
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

/** Same shape of guard as download-library-image.ts's --filename check. */
function assertSafeSlug(slug: string): void {
  if (!slug || slug.includes("/") || slug.includes("\\") || slug.includes("..")) {
    fail(`Invalid slug "${slug}" — must be a plain slug, not a path.`);
  }
}

function findArticleFile(slug: string): { file: string; data: ArticleFrontmatter; raw: string } | null {
  if (!fs.existsSync(CONTENT_DIR)) return null;
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const fullPath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(raw) as unknown as { data: Record<string, unknown> };
    if (data.slug === slug) {
      return {
        file,
        raw,
        data: {
          title: String(data.title ?? ""),
          slug: String(data.slug ?? ""),
          category: String(data.category ?? ""),
          language: String(data.language ?? "ne"),
          summary: String(data.summary ?? ""),
          status: String(data.status ?? ""),
          tags: Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === "string") : [],
        },
      };
    }
  }
  return null;
}

function readLibraryManifest(): LibraryImageRecord[] {
  if (!fs.existsSync(LIBRARY_MANIFEST_PATH)) return [];
  const raw = fs.readFileSync(LIBRARY_MANIFEST_PATH, "utf8").trim();
  if (!raw) return [];
  return JSON.parse(raw) as LibraryImageRecord[];
}

/** Mirrors src/lib/library/match.ts's normalize(). */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Mirrors src/lib/library/match.ts's hasLocalityMatch() — localityTerms comes from the active city's config, not a hard-coded list. */
function hasLocalityMatch(image: LibraryImageRecord, localityTerms: string[]): boolean {
  const haystack = normalize(`${image.tags.join(" ")} ${image.description}`);
  return localityTerms.some((keyword) => haystack.includes(normalize(keyword)));
}

/**
 * Mirrors src/lib/library/match.ts's rankImages()/scoreImage() — soft
 * category signal (not a hard filter), weighted tag/locality/usage score,
 * gated by hasTopicEvidence (tagScore > 0): category + locality + usage
 * alone can never produce a match, only strengthen a real topic overlap.
 * See that file for the full rationale, including the ward-9
 * drainage-cleanup / immigration-office-photo case this gate exists to fix.
 */
function findSuitableLibraryImage(article: ArticleFrontmatter): LibraryImageRecord | null {
  const candidates = readLibraryManifest().filter((image) => image.approved === true);
  if (candidates.length === 0) return null;

  const localityTerms = getLocalityTerms();
  const queryTags = new Set(article.tags.map(normalize));
  const queryText = normalize(`${article.title} ${article.summary}`);

  const ranked = candidates
    .map((image) => {
      let tagScore = 0;
      for (const rawTag of image.tags) {
        const tag = normalize(rawTag);
        if (!tag) continue;
        if (queryTags.has(tag)) tagScore += WEIGHTS.tagExact;
        else if (queryText.includes(tag)) tagScore += WEIGHTS.tagSubstring;
      }
      const categoryMatch = image.category === article.category;
      const localityMatch = hasLocalityMatch(image, localityTerms);
      const isDocumentary = image.usage === "documentary";
      const score =
        tagScore +
        (categoryMatch ? WEIGHTS.categoryMatch : 0) +
        (localityMatch ? WEIGHTS.locality : 0) +
        (isDocumentary ? WEIGHTS.documentaryUsage : 0);
      return { image, score, hasTopicEvidence: tagScore > 0 };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || !best.hasTopicEvidence || best.score < DEFAULT_MIN_MATCH_SCORE) return null;
  return best.image;
}

/** Mirrors src/lib/ai-image/promptBuilder.ts's buildImagePrompt(). */
function buildImagePrompt(article: ArticleFrontmatter): string {
  const tagsLine = article.tags.length > 0 ? article.tags.join(", ") : undefined;
  const subjectLines = [
    `Article title: ${article.title}`,
    `Category: ${article.category}`,
    `Summary: ${article.summary}`,
    tagsLine ? `Tags: ${tagsLine}` : null,
    "Setting: eastern Nepal / Terai region — generic, not a specific identifiable location",
  ].filter((l): l is string => l !== null);

  return [
    "Generate a single editorial illustration (not a photograph) for a Nepali local-news website article.",
    "",
    ...subjectLines,
    "",
    "Style and safety requirements:",
    ...STYLE_RULES.map((rule, i) => `${i + 1}. ${rule}`),
  ].join("\n");
}

interface GeneratedImage {
  bytes: Buffer;
  contentType: string;
  provider: string;
  promptVersion: string;
  generatedAt: string;
}

/** Mirrors src/lib/ai-image/providers/mockProvider.ts. Never touches the network. */
function generateWithMockProvider(): GeneratedImage {
  return {
    bytes: Buffer.from(MOCK_PNG_BASE64, "base64"),
    contentType: "image/png",
    provider: "mock",
    promptVersion: PROMPT_VERSION,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Mirrors src/lib/ai-image/providers/openaiProvider.ts exactly — see that
 * file's header for the documentation this was built against. One request,
 * no retries: a failure here is surfaced to the caller immediately via fail().
 */
async function generateWithOpenAiProvider(prompt: string): Promise<GeneratedImage> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    fail(
      "OPENAI_API_KEY is not set. Add it to .env.local (never NEXT_PUBLIC_OPENAI_API_KEY, " +
        "never commit it) before using --provider openai."
    );
  }

  console.log(`Calling OpenAI (${OPENAI_MODEL}, quality=${OPENAI_QUALITY}, size=${OPENAI_SIZE})... this costs money.`);

  const response = await fetch(OPENAI_IMAGES_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      prompt,
      n: 1,
      size: OPENAI_SIZE,
      quality: OPENAI_QUALITY,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    const message = errorBody?.error?.message ?? `HTTP ${response.status} ${response.statusText}`;
    fail(`OpenAI image generation failed: ${message}`);
  }

  const body = (await response.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) {
    fail("OpenAI image generation succeeded but the response contained no image data.");
  }

  return {
    bytes: Buffer.from(b64, "base64"),
    contentType: "image/png",
    provider: "openai",
    promptVersion: PROMPT_VERSION,
    generatedAt: new Date().toISOString(),
  };
}

function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      fail(`Unsupported image content type "${contentType}"`);
  }
}

function buildAltText(article: ArticleFrontmatter): string {
  if (article.language === "en") {
    return `AI-generated symbolic illustration related to: ${article.title}`;
  }
  return `${article.title} सम्बन्धी AI-निर्मित प्रतीकात्मक चित्रण।`;
}

function yamlQuote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Replaces ONLY the `featuredImage:` key's span inside the YAML
 * frontmatter with newLines, leaving every other frontmatter field and the
 * entire Markdown body byte-for-byte untouched. Deliberately not
 * gray-matter's stringify() round-trip, which would reformat the whole
 * frontmatter block (quoting/ordering) rather than touching only this key.
 */
function replaceFeaturedImageBlock(raw: string, newLines: string[]): string {
  const lines = raw.split("\n");
  if (lines[0]?.trim() !== "---") {
    fail("Article file does not start with a YAML frontmatter delimiter (---).");
  }

  let closeIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === "---") {
      closeIdx = i;
      break;
    }
  }
  if (closeIdx === -1) {
    fail("Could not find the closing --- for the article's frontmatter.");
  }

  let startIdx = -1;
  for (let i = 1; i < closeIdx; i++) {
    if (/^featuredImage:/.test(lines[i] ?? "")) {
      startIdx = i;
      break;
    }
  }

  let endIdx: number;
  if (startIdx === -1) {
    // No existing featuredImage key — insert right before the closing delimiter.
    startIdx = closeIdx;
    endIdx = closeIdx;
  } else {
    endIdx = startIdx + 1;
    while (endIdx < closeIdx && /^[ \t]/.test(lines[endIdx] ?? "")) endIdx++;
  }

  return [...lines.slice(0, startIdx), ...newLines, ...lines.slice(endIdx)].join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.slug) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  if (args.provider !== "mock" && args.provider !== "openai") {
    fail(
      `Image generation provider "${args.provider}" is not implemented yet. ` +
        `Use "mock" (default, free) or "openai" (real, costs money).`
    );
  }

  const slug = args.slug;
  assertSafeSlug(slug);

  const found = findArticleFile(slug);
  if (!found) fail(`No article found with slug "${slug}" in content/articles/.`);
  const { file, data: article, raw } = found;

  if (article.status !== "draft") {
    fail(
      `Article "${slug}" has status "${article.status}" — AI image generation is only ` +
        `available for draft articles being prepared for editorial review. ` +
        `Published articles are never touched by this script.`
    );
  }

  const libraryMatch = findSuitableLibraryImage(article);
  if (libraryMatch) {
    console.log(
      `\nAn approved library image already exists for this article:\n` +
        `  public/images/library/${libraryMatch.category}/${libraryMatch.filename}\n` +
        `  "${libraryMatch.description}"\n\n` +
        `Use that image instead of generating an AI illustration. Stopping — no image was generated.\n`
    );
    process.exit(0);
  }

  console.log(`No suitable approved library image for "${article.category}". Building AI illustration prompt...`);
  const prompt = buildImagePrompt(article);
  console.log(`\n--- Prompt (promptVersion ${PROMPT_VERSION}) ---\n${prompt}\n---\n`);

  const generated =
    args.provider === "openai" ? await generateWithOpenAiProvider(prompt) : generateWithMockProvider();
  const extension = extensionForContentType(generated.contentType);
  const filename = `${slug}.${extension}`;
  const destPath = path.join(ARTICLES_IMAGE_DIR, filename);

  // Defense in depth, even though `filename` is built from an already-validated slug.
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    fail(`Refusing to write unsafe destination filename "${filename}".`);
  }

  if (fs.existsSync(destPath) && !args.force) {
    fail(`"${filename}" already exists under public/images/articles/. Re-run with --force to overwrite.`);
  }

  fs.mkdirSync(ARTICLES_IMAGE_DIR, { recursive: true });
  fs.writeFileSync(destPath, generated.bytes);
  console.log(`Saved image to public/images/articles/${filename} (provider: ${generated.provider})`);

  const alt = buildAltText(article);
  const featuredImageLines = [
    "featuredImage:",
    `  src: /images/articles/${filename}`,
    `  alt: ${yamlQuote(alt)}`,
    `  caption: ${yamlQuote(AI_ILLUSTRATION_DISCLOSURE)}`,
    `  type: ai-generated-illustration`,
    `  usage: illustrative`,
    `  generatedAt: ${yamlQuote(generated.generatedAt)}`,
    `  provider: ${generated.provider}`,
    `  promptVersion: ${generated.promptVersion}`,
  ];

  const updatedRaw = replaceFeaturedImageBlock(raw, featuredImageLines);
  fs.writeFileSync(path.join(CONTENT_DIR, file), updatedRaw);

  console.log(`Updated featuredImage in content/articles/${file}. Article status remains "${article.status}".`);
  console.log(`\nReminder: ${AI_ILLUSTRATION_DISCLOSURE}`);
  console.log(`Review the image before publishing — nothing was auto-published.\n`);
}

main();
