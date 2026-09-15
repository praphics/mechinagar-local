/**
 * Editorial-time CLI tool — creates a Beehiiv DRAFT (never sends,
 * schedules, or publishes) from an already-generated newsletter under
 * content/newsletters/. This is a standalone script, not part of the
 * running website: nothing in the app imports or invokes it
 * automatically, and generating a newsletter (scripts/build-newsletter.ts)
 * never calls this script itself — draft creation is always a separate,
 * explicit, human-invoked step.
 *
 * Run with Node's built-in TypeScript support — no extra packages needed:
 *
 *   node --experimental-strip-types --env-file-if-exists=.env.local scripts/newsletter-beehiiv-draft.ts <date> [--force]
 *   npm run newsletter:draft -- <date> [--force]
 *
 * --env-file-if-exists=.env.local is how this standalone script reads
 * BEEHIIV_API_KEY — same pattern as scripts/generate-image.ts's
 * OPENAI_API_KEY (Next.js auto-loads .env.local for the running app, a
 * plain `node` process doesn't).
 *
 * SAFETY — read before changing anything:
 *   - Every Beehiiv post this script creates has `status: "draft"`,
 *     hard-coded, never read from an argument or config. Per Beehiiv's
 *     own current API documentation (developers.beehiiv.com/api-reference
 *     /posts/create; confirmed 2026-08-16): status "draft" = "Post has
 *     not been scheduled" — a genuine non-sending state, distinct from
 *     "confirmed" (sends/publishes, immediately or at scheduled_at) and
 *     "archived". This script must NEVER pass status: "confirmed", never
 *     pass scheduled_at, and must NEVER omit status and rely on whatever
 *     Beehiiv's current default happens to be (that default has changed
 *     at least once — see the same doc page's August 2026 changelog note
 *     — explicit is the only safe choice here).
 *   - This script never sends, schedules, or publishes anything, and
 *     never will — that is a deliberate, separate, future milestone, not
 *     something this file grows into by adding a flag.
 *
 * Duplicates a small amount of article/date-filtering logic that also
 * exists in scripts/build-newsletter.ts — same reason as that script's
 * own duplication of src/lib/content/articles.ts: this is a standalone
 * script, can't resolve the "@/" path alias. Reuses the `gray-matter` and
 * `marked` npm packages already used elsewhere in this project (no new
 * dependency added) to parse the newsletter's frontmatter and convert its
 * Markdown body to the HTML Beehiiv's API expects.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const NEWSLETTER_DIR = path.join(process.cwd(), "content", "newsletters");
const CONTENT_DIR = path.join(process.cwd(), "content", "articles");
const CITY_CONFIG_PATH = path.join(process.cwd(), ".claude", "city-config.json");
const NEWSROOM_STATE_PATH = path.join(process.cwd(), ".claude", "newsroom", "state.json");
const BEEHIIV_STATE_PATH = path.join(process.cwd(), ".claude", "newsletter-beehiiv", "state.json");
const NEPAL_TIMEZONE = "Asia/Kathmandu";

const BEEHIIV_API_BASE = "https://api.beehiiv.com/v2";

interface ParsedArgs {
  date?: string;
  force: boolean;
  help: boolean;
}

function printHelp(): void {
  console.log(`
Create a Beehiiv DRAFT (never sends/schedules/publishes) from an
already-generated newsletter.

Usage:
  npm run newsletter:draft -- <date> [options]

Required:
  <date>                  YYYY-MM-DD — must match an existing
                           content/newsletters/<date>.md file

Options:
  --force                  Create a new Beehiiv draft even if one is
                            already recorded for this date (idempotency
                            override — see .claude/newsletter-beehiiv/README.md)
  --help                   Show this help

This script never sends, schedules, or publishes anything — every post it
creates has status: "draft". It stops (without calling Beehiiv) if
BEEHIIV_API_KEY or the configured Beehiiv publication ID is missing, if
the newsletter isn't a genuine draft-status review artifact, if any of
its source articles isn't published, or if any source article is still
blocked on required evidence.
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
    if (arg.startsWith("--")) {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
    if (!args.date) {
      args.date = arg;
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

function readJsonFile(filePath: string): unknown {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function nepalDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NEPAL_TIMEZONE }).format(date);
}

/** Re-derives which articles a given date's newsletter drew from, and their CURRENT (freshly re-read) status. Mirrors build-newsletter.ts's own date filter, duplicated for the same reason. */
function findArticlesForDate(targetDate: string): Array<{ slug: string; status: string; file: string }> {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const matches: Array<{ slug: string; status: string; file: string }> = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    const { data } = matter(raw) as unknown as { data: Record<string, unknown> };
    const publishedAt = typeof data.publishedAt === "string" ? data.publishedAt : null;
    if (!publishedAt) continue;
    const d = new Date(publishedAt);
    if (Number.isNaN(d.getTime())) continue;
    if (nepalDateString(d) !== targetDate) continue;
    matches.push({ slug: String(data.slug ?? file), status: String(data.status ?? ""), file });
  }
  return matches;
}

interface SafetyCheckResult {
  ok: boolean;
  failures: string[];
}

/**
 * Content/editorial safety — checks 1-5 from Phase 7B's spec. Deliberately
 * independent of Beehiiv credentials/publicationId (see
 * runBeehiivPrereqChecks below) so idempotency can be checked in between:
 * if a draft already exists for this date, there's no reason to demand
 * working Beehiiv credentials just to report that.
 */
function runContentSafetyChecks(date: string, newsletterData: Record<string, unknown>): SafetyCheckResult {
  const failures: string[] = [];

  // 1. newsletter exists — caller already confirmed the file was read; nothing further here.

  // 2. newsletter is marked review-only (status: draft in its own frontmatter).
  if (newsletterData.status !== "draft") {
    failures.push(`newsletter frontmatter status is "${String(newsletterData.status)}", not "draft" — refusing to treat it as review-only.`);
  }

  // Proxy for "has passed the existing editorial-generation workflow":
  // the real generator always stamps these fields; a hand-edited or
  // foreign file wouldn't have all of them.
  for (const field of ["date", "generatedAt", "articleCount"]) {
    if (!(field in newsletterData)) {
      failures.push(`newsletter frontmatter is missing "${field}" — doesn't look like output from scripts/build-newsletter.ts.`);
    }
  }

  // 3. source articles are published; no source article is draft. Conservative
  // by design: flags ANY draft-status article sharing this newsletter's date,
  // even though the newsletter markdown itself doesn't retain which exact
  // article slugs were selected into it (build-newsletter.ts already only
  // ever selects from published articles, so this is mainly a defense
  // against status drift *since* generation — e.g. an article unpublished
  // after the newsletter was built). A false block here is safe; a false
  // pass would not be.
  const sourceArticles = findArticlesForDate(date);
  const draftSources = sourceArticles.filter((a) => a.status !== "published");
  if (draftSources.length > 0) {
    failures.push(
      `${draftSources.length} source article(s) for ${date} are not published: ${draftSources.map((a) => `${a.slug} (${a.status})`).join(", ")}.`
    );
  }

  // 4. no unresolved evidence-required story among this date's source articles.
  const newsroomState = readJsonFile(NEWSROOM_STATE_PATH) as { stories?: Record<string, { evidenceRequired?: boolean }> } | null;
  if (newsroomState?.stories) {
    for (const article of sourceArticles) {
      const story = newsroomState.stories[article.slug];
      if (story?.evidenceRequired === true) {
        failures.push(`source article "${article.slug}" is still blocked on required evidence (newsroom state) — cannot include in a Beehiiv draft.`);
      }
    }
  }

  // 5. city configuration is valid.
  const cityConfig = readJsonFile(CITY_CONFIG_PATH) as Record<string, unknown> | null;
  if (!cityConfig) {
    failures.push("city configuration (.claude/city-config.json) is missing or invalid JSON.");
  } else {
    const newsletterCfg = cityConfig.newsletter as Record<string, unknown> | undefined;
    if (!newsletterCfg || !newsletterCfg.newsletterName) {
      failures.push("city configuration has no newsletter.newsletterName — city configuration is invalid for this purpose.");
    }
  }

  return { ok: failures.length === 0, failures };
}

/** Beehiiv-specific prerequisites — checks 6-7 from Phase 7B's spec. Only evaluated once idempotency has already ruled out "nothing to do." */
function runBeehiivPrereqChecks(apiKey: string | undefined, publicationId: string | null): SafetyCheckResult {
  const failures: string[] = [];

  if (!apiKey || !apiKey.trim()) {
    failures.push('BEEHIIV_API_KEY is not set. Add it to .env.local (never NEXT_PUBLIC_BEEHIIV_API_KEY, never commit it) — see this script\'s header comment.');
  }

  if (!publicationId || !publicationId.trim()) {
    failures.push(
      'No Beehiiv publication ID is configured. Set .claude/city-config.json\'s "newsletter.beehiiv.publicationId" to your real publication ID (a non-secret identifier — safe to store there, never invent one).'
    );
  }

  return { ok: failures.length === 0, failures };
}

/** Extracts the first "# " heading as the post title; everything else becomes the HTML body. */
function splitTitleAndBody(markdown: string): { title: string; bodyMarkdown: string } {
  const lines = markdown.split("\n");
  const titleIndex = lines.findIndex((l) => l.startsWith("# "));
  if (titleIndex === -1) {
    return { title: "Untitled newsletter", bodyMarkdown: markdown };
  }
  const title = lines[titleIndex].replace(/^#\s+/, "").trim();
  const bodyMarkdown = [...lines.slice(0, titleIndex), ...lines.slice(titleIndex + 1)].join("\n").trim();
  return { title, bodyMarkdown };
}

interface BeehiivDraftResult {
  id: string;
  status: string;
}

interface BeehiivDraftStateEntry {
  newsletterFile: string;
  beehiivDraftId: string;
  createdAt: string;
  verifiedStatus?: string;
  verifiedAt?: string;
  previewUrl?: string | null;
}

interface BeehiivState {
  drafts: Record<string, BeehiivDraftStateEntry>;
}

/**
 * The only place this file calls Beehiiv. Always explicit
 * status: "draft" — see file header. Never retried on failure.
 */
async function createBeehiivDraft(
  publicationId: string,
  apiKey: string,
  title: string,
  bodyHtml: string
): Promise<BeehiivDraftResult> {
  const response = await fetch(`${BEEHIIV_API_BASE}/publications/${publicationId}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      body_content: bodyHtml,
      status: "draft", // never "confirmed", never scheduled — see file header
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    // Diagnostic only — never includes the Authorization header/key.
    throw new Error(`Beehiiv API returned HTTP ${response.status} ${response.statusText}: ${errorBody.slice(0, 500)}`);
  }

  const body = (await response.json()) as { data?: { id?: string; status?: string } };
  const id = body.data?.id;
  if (!id) {
    throw new Error("Beehiiv API responded successfully but returned no post id.");
  }
  return { id, status: body.data?.status ?? "unknown" };
}

/**
 * Confirmed by testing this script for real (2026-08-16): Beehiiv's
 * Create-post response can return before the post has finished being
 * created — its own docs say so — so the `status` field on the create
 * response is not reliable. This does a follow-up GET (read-only, no
 * mutation) to get the actual, settled status and a human-reviewable
 * preview URL, rather than trusting the create response's possibly-stale
 * "unknown".
 */
async function verifyBeehiivDraft(
  publicationId: string,
  apiKey: string,
  postId: string
): Promise<{ status: string; previewUrl: string | null }> {
  const response = await fetch(`${BEEHIIV_API_BASE}/publications/${publicationId}/posts/${postId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    return { status: "unverified (follow-up check failed)", previewUrl: null };
  }
  const body = (await response.json()) as { data?: { status?: string; preview_url?: string } };
  return { status: body.data?.status ?? "unknown", previewUrl: body.data?.preview_url ?? null };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.date) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const date = args.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fail(`Date must be in YYYY-MM-DD format, got "${date}".`);
  }

  const newsletterPath = path.join(NEWSLETTER_DIR, `${date}.md`);
  if (!fs.existsSync(newsletterPath)) {
    fail(`No newsletter found at content/newsletters/${date}.md. Generate it first with npm run newsletter:today (or --date ${date}).`);
  }
  const raw = fs.readFileSync(newsletterPath, "utf8");
  const { data, content } = matter(raw) as unknown as { data: Record<string, unknown>; content: string };

  const cityConfig = readJsonFile(CITY_CONFIG_PATH) as Record<string, unknown> | null;
  const newsletterCfg = (cityConfig?.newsletter ?? {}) as Record<string, unknown>;
  const beehiivCfg = (newsletterCfg.beehiiv ?? {}) as Record<string, unknown>;
  const publicationId = typeof beehiivCfg.publicationId === "string" ? beehiivCfg.publicationId : null;
  const apiKey = process.env.BEEHIIV_API_KEY;

  console.log(`Checking content/editorial safety gates for content/newsletters/${date}.md...`);
  const contentCheck = runContentSafetyChecks(date, data);
  if (!contentCheck.ok) {
    console.error(`\n${contentCheck.failures.length} safety check(s) failed — refusing to call Beehiiv:\n`);
    for (const f of contentCheck.failures) console.error(`  - ${f}`);
    console.error("\nNo Beehiiv API call was made.\n");
    process.exit(1);
  }
  console.log("Content/editorial safety checks passed.");

  // Idempotency — checked before the Beehiiv-specific prerequisites below,
  // so "a draft already exists" is reported even without working
  // credentials configured; no reason to demand those just to say "done."
  const beehiivState: BeehiivState = (readJsonFile(BEEHIIV_STATE_PATH) as BeehiivState | null) ?? { drafts: {} };
  const existing = beehiivState.drafts[date];
  if (existing && !args.force) {
    console.log(
      `\nA Beehiiv draft already exists for ${date}: ${existing.beehiivDraftId} (created ${existing.createdAt}).\n` +
        `Not creating a duplicate. Re-run with --force if you specifically want a new draft.\n`
    );

    // Refresh (read-only) rather than re-create: if credentials are
    // available, re-check the existing draft's status and update our own
    // local cache of it. This never touches the Beehiiv draft itself —
    // only a GET — so it's safe to do even though a draft already exists.
    if (apiKey && publicationId) {
      const refreshed = await verifyBeehiivDraft(publicationId, apiKey, existing.beehiivDraftId);
      existing.verifiedStatus = refreshed.status;
      existing.verifiedAt = new Date().toISOString();
      existing.previewUrl = refreshed.previewUrl;
      fs.writeFileSync(BEEHIIV_STATE_PATH, JSON.stringify(beehiivState, null, 2) + "\n");
      console.log(`Refreshed verification: status "${refreshed.status}"${refreshed.previewUrl ? `, preview: ${refreshed.previewUrl}` : ""}\n`);
    } else {
      console.log("(Skipped refreshing its verification status — BEEHIIV_API_KEY/publication ID not available.)\n");
    }
    return;
  }

  const prereqCheck = runBeehiivPrereqChecks(apiKey, publicationId);
  if (!prereqCheck.ok) {
    console.error(`\n${prereqCheck.failures.length} Beehiiv prerequisite(s) missing — refusing to call Beehiiv:\n`);
    for (const f of prereqCheck.failures) console.error(`  - ${f}`);
    console.error("\nNo Beehiiv API call was made.\n");
    process.exit(1);
  }

  const { title, bodyMarkdown } = splitTitleAndBody(content);
  const bodyHtml = marked.parse(bodyMarkdown, { async: false }) as string;

  console.log(`\nCreating Beehiiv draft — title: "${title}"`);
  console.log("status: draft (will NOT be sent, scheduled, or published)");

  let result: BeehiivDraftResult;
  try {
    // publicationId/apiKey are guaranteed non-null past the safety checks above.
    result = await createBeehiivDraft(publicationId as string, apiKey as string, title, bodyHtml);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\nBeehiiv draft creation failed: ${message}`);
    console.error("Not retried. Newsletter file and article statuses were not touched.\n");
    process.exit(1);
  }

  const createdAt = new Date().toISOString();
  console.log(`\nBeehiiv draft created: ${result.id}`);
  console.log("Verifying its settled status with a follow-up read (the create response can return before Beehiiv finishes creating the post)...");
  const verified = await verifyBeehiivDraft(publicationId as string, apiKey as string, result.id);

  beehiivState.drafts[date] = {
    newsletterFile: `content/newsletters/${date}.md`,
    beehiivDraftId: result.id,
    createdAt,
    verifiedStatus: verified.status,
    verifiedAt: new Date().toISOString(),
    previewUrl: verified.previewUrl,
  };
  fs.mkdirSync(path.dirname(BEEHIIV_STATE_PATH), { recursive: true });
  fs.writeFileSync(BEEHIIV_STATE_PATH, JSON.stringify(beehiivState, null, 2) + "\n");

  if (verified.status !== "draft") {
    // Should be unreachable given the request explicitly sent status:
    // "draft" — but if Beehiiv ever reports otherwise, say so loudly
    // rather than printing a reassuring "not sent" message that isn't true.
    console.error(`\nWARNING: Beehiiv reports this post's status as "${verified.status}", not "draft". Do not assume it is safe — check it in Beehiiv directly before doing anything else.\n`);
    process.exit(1);
  }

  console.log(`Confirmed: Beehiiv reports status "draft". This draft was NOT sent, scheduled, or published.`);
  if (verified.previewUrl) console.log(`Review it here: ${verified.previewUrl}`);
  console.log("Take no further action here — sending is a separate, future, explicitly human-invoked step.\n");
}

main();
