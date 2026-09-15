/**
 * Editorial-time CLI tool — builds a Markdown newsletter DRAFT from today's
 * (or a given date's) published articles. This is a standalone script, not
 * part of the running website: nothing in the app imports or invokes it
 * automatically, and it never touches Beehiiv or any other external
 * service — output is a local Markdown file only, meant to be reviewed and
 * pasted into Beehiiv by a human later.
 *
 * Run with Node's built-in TypeScript support — no extra packages needed:
 *
 *   node --experimental-strip-types scripts/build-newsletter.ts [--today | --date YYYY-MM-DD] [--force]
 *   npm run newsletter:today
 *
 * This script duplicates a small amount of frontmatter-parsing,
 * category-label, and reading-time logic that also exists in
 * src/lib/content/articles.ts, src/lib/data/categories.ts, and
 * src/lib/content/readingTime.ts — same reason and same pattern as
 * scripts/download-library-image.ts and scripts/generate-image.ts: this
 * script runs standalone via Node and can't resolve the "@/" path alias
 * those files use internally. (A relative import with an explicit ".ts"
 * extension does work at runtime here, but breaks `tsc --noEmit` without
 * project-wide "allowImportingTsExtensions" — not worth changing tsconfig
 * for one script, so duplication it is. See readingTime.ts's own header
 * for why it's written with zero internal imports regardless — that's
 * still useful if this repo ever adds a bundler-run test setup.)
 *
 * Reads .claude/city-config.json for the newsletter title and city name
 * (see readNewsletterCityConfig() below) — added in Milestone 6E.1 to
 * remove a prior hard-coded "Mechinagar Local Daily" / "मेचीनगर" literal.
 * Category labels remain a project-schema mirror of
 * src/lib/data/categories.ts (see CATEGORY_LABELS_NE's own comment) —
 * deliberately NOT duplicated into city-config.json.
 *
 * Never calls any network API. Never sends or publishes anything — output
 * is always a local file with `status: draft` frontmatter.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// Mirrors src/lib/content/readingTime.ts's estimateReadingMinutes().
const WORDS_PER_MINUTE = 200;
function estimateReadingMinutes(text: string): number {
  const trimmed = text.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");
const NEWSLETTER_DIR = path.join(process.cwd(), "content", "newsletters");
const NEPAL_TIMEZONE = "Asia/Kathmandu";
const CITY_CONFIG_PATH = path.join(process.cwd(), ".claude", "city-config.json");

interface NewsletterCityConfig {
  newsletterNameEn: string;
  cityNameNe: string;
}

/**
 * Mirrors src/lib/cityConfig.ts — reads the active city's newsletter name
 * and city name from city-config.json rather than hard-coded
 * "Mechinagar Local Daily" / "मेचीनगर" literals (see Milestone 6E.1).
 * Falls back to generic, non-Mechinagar placeholders if the config is
 * missing or doesn't define these fields, so a misconfigured second city
 * gets honestly-generic output rather than an inherited Mechinagar one.
 */
function readNewsletterCityConfig(): NewsletterCityConfig {
  const fallback: NewsletterCityConfig = { newsletterNameEn: "Local Daily", cityNameNe: "यस क्षेत्र" };
  if (!fs.existsSync(CITY_CONFIG_PATH)) return fallback;
  const raw = fs.readFileSync(CITY_CONFIG_PATH, "utf8").trim();
  if (!raw) return fallback;
  let config: unknown;
  try {
    config = JSON.parse(raw);
  } catch {
    return fallback;
  }
  const obj = config as Record<string, unknown>;
  const newsletter = obj.newsletter as Record<string, unknown> | undefined;
  const newsletterName = newsletter?.newsletterName as Record<string, unknown> | undefined;
  const cityIdentity = obj.cityIdentity as Record<string, unknown> | undefined;
  const cityName = cityIdentity?.cityName as Record<string, unknown> | undefined;

  const en = newsletterName?.en;
  const ne = cityName?.ne;
  return {
    newsletterNameEn: typeof en === "string" && en.trim() !== "" ? en : fallback.newsletterNameEn,
    cityNameNe: typeof ne === "string" && ne.trim() !== "" ? ne : fallback.cityNameNe,
  };
}

// Mirrors src/lib/data/categories.ts's `categories` — kept as a separate
// literal here for the same reason scripts/download-library-image.ts
// duplicates LIBRARY_CATEGORIES: this script can't import that file (no
// "@/" alias at runtime). This is a project-schema mirror, not a
// per-city configuration value — categories.ts is deliberately NOT
// duplicated into city-config.json (see that file's README on avoiding a
// second competing category list), so a genuinely different city's
// category set means editing categories.ts (and this mirror) directly,
// same as any other project-schema change. categoryLabel() below
// degrades gracefully to the raw slug for anything not in this map, so an
// unmapped category never breaks the newsletter — it just shows less
// polished until this mirror is updated to match.
const CATEGORY_LABELS_NE: Record<string, string> = {
  "local-news": "स्थानीय समाचार",
  government: "सरकार तथा सूचना",
  "kakarvitta-border": "काकरभिट्टा सीमा",
  business: "व्यापार तथा अर्थतन्त्र",
  community: "समुदाय",
  infrastructure: "सडक तथा पूर्वाधार",
};

const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function toNepaliDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => NEPALI_DIGITS[Number(d)]);
}
const NE_WEEKDAYS = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
const NE_MONTHS = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर",
];

/** e.g. "शुक्रबार, १५ अगस्ट २०२६" — mirrors src/lib/datetime.ts's formatNepaliDateLong(). */
function formatNepaliDateLong(date: Date): string {
  const weekday = NE_WEEKDAYS[date.getDay()];
  const day = toNepaliDigits(String(date.getDate()));
  const month = NE_MONTHS[date.getMonth()];
  const year = toNepaliDigits(String(date.getFullYear()));
  return `${weekday}, ${day} ${month} ${year}`;
}

/** YYYY-MM-DD in Nepal time, regardless of the machine's own timezone. */
function nepalDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NEPAL_TIMEZONE }).format(date);
}

interface ParsedArgs {
  date?: string;
  force: boolean;
  help: boolean;
}

function printHelp(): void {
  console.log(`
Build a Markdown newsletter draft from published articles.

Usage:
  npm run newsletter:today
  node --experimental-strip-types scripts/build-newsletter.ts [options]

Options:
  --today                 Use today's date in Nepal time (the default if no option is given)
  --date YYYY-MM-DD        Build the newsletter for a specific date instead
  --force                  Required to overwrite an existing draft for that date
  --help                   Show this help

Reads ONLY published articles. Never calls Beehiiv or any other external
API, never sends email. Writes a local Markdown draft to
content/newsletters/YYYY-MM-DD.md with "status: draft" frontmatter — review
and paste into Beehiiv yourself when ready.
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
    if (arg === "--today") {
      continue; // today (Nepal time) is the default when --date isn't given
    }
    if (arg === "--date") {
      args.date = argv[++i];
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

interface ArticleSummary {
  slug: string;
  title: string;
  category: string;
  summary: string;
  publishedAt: string;
  featured: boolean;
  bodyRaw: string;
}

function loadPublishedArticlesForDate(targetDate: string): ArticleSummary[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  const matches: ArticleSummary[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    const { data, content } = matter(raw) as unknown as { data: Record<string, unknown>; content: string };

    if (data.status !== "published") continue;
    const publishedAt = typeof data.publishedAt === "string" ? data.publishedAt : null;
    if (!publishedAt) continue;
    const publishedDate = new Date(publishedAt);
    if (Number.isNaN(publishedDate.getTime())) continue;
    if (nepalDateString(publishedDate) !== targetDate) continue;

    matches.push({
      slug: String(data.slug ?? file.replace(/\.md$/, "")),
      title: String(data.title ?? ""),
      category: String(data.category ?? ""),
      summary: String(data.summary ?? ""),
      publishedAt,
      featured: data.featured === true,
      bodyRaw: content.trim(),
    });
  }

  // Featured first, then most-recently-published — same priority
  // TodaysMechinagar.tsx gives the homepage's lead stories.
  return matches.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

function categoryLabel(slug: string): string {
  return CATEGORY_LABELS_NE[slug] ?? slug;
}

function oneSentenceSummary(summary: string): string {
  // Article summaries are already written as a single sentence/short blurb
  // (see content/articles/*.md convention) — this just guards against a
  // stray multi-sentence summary spilling extra sentences into the digest.
  const firstSentence = summary.split(/(?<=[।.!?])\s+/)[0];
  return (firstSentence || summary).trim();
}

function buildNewsletterMarkdown(targetDate: string, articles: ArticleSummary[]): string {
  const dateObj = new Date(`${targetDate}T00:00:00+05:45`);
  const dateHeading = formatNepaliDateLong(dateObj);

  const MAIN_STORY_LIMIT = 6;
  const BRIEF_LIMIT = 5;
  const mainStories = articles.slice(0, MAIN_STORY_LIMIT);
  const briefArticles = articles.slice(MAIN_STORY_LIMIT, MAIN_STORY_LIMIT + BRIEF_LIMIT);

  const { newsletterNameEn, cityNameNe } = readNewsletterCityConfig();

  const lines: string[] = [];
  lines.push(`# ${newsletterNameEn}`, "");
  lines.push(dateHeading, "");
  lines.push(
    `नमस्ते! ${cityNameNe} र वरपरका क्षेत्रबाट आजका प्रमुख अपडेटहरू यहाँ छन्।`,
    ""
  );

  lines.push("## आजका मुख्य समाचार", "");
  for (const article of mainStories) {
    const minutes = estimateReadingMinutes(article.bodyRaw);
    lines.push(`### ${article.title}`, "");
    lines.push(oneSentenceSummary(article.summary), "");
    lines.push(`*${categoryLabel(article.category)} · अनुमानित पढ्ने समय: ${toNepaliDigits(String(minutes))} मिनेट*`, "");
  }

  // Per local-newsletter/SKILL.md's own "Short updates" section: only
  // included when genuinely additional published material exists beyond
  // the main stories — omit the section entirely (header included)
  // rather than padding it with a placeholder line. A previous version of
  // this script always showed the header with a filler line when empty;
  // that was a bug relative to the skill's own documented spec, fixed
  // here (see Phase 7A).
  if (briefArticles.length > 0) {
    lines.push("## छोटकरीमा", "");
    for (const article of briefArticles) {
      lines.push(`- **${article.title}** — ${categoryLabel(article.category)}`);
    }
    lines.push("");
  }

  // Per local-newsletter/SKILL.md's "Tomorrow" section: only included
  // when the source material provides genuinely reliable information
  // about upcoming events/notices — never inferred from publish dates,
  // assumptions, or recurring patterns. This script has no such data
  // source today (article frontmatter carries no "upcoming event" field),
  // so this section is always omitted rather than filled with a generic
  // "check back tomorrow" placeholder, which is itself a form of invented
  // content the skill explicitly forbids. A previous version of this
  // script always emitted that placeholder; fixed here (see Phase 7A).
  const tomorrowPreview: string | null = null; // no real "known upcoming" data source exists yet
  if (tomorrowPreview) {
    lines.push("## भोलिको झलक", "");
    lines.push(tomorrowPreview, "");
  }

  lines.push("---", "");
  lines.push("Thanks for supporting independent local journalism.");

  return lines.join("\n") + "\n";
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.date && !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
    fail(`--date must be in YYYY-MM-DD format, got "${args.date}".`);
  }

  const targetDate = args.date ?? nepalDateString(new Date());

  const articles = loadPublishedArticlesForDate(targetDate);
  if (articles.length === 0) {
    console.log(
      `\nकुनै लेख प्रकाशित भएन। ${targetDate} मा कुनै समाचार प्रकाशित नभएकाले न्यूजलेटर ड्राफ्ट तयार गरिएन।\n` +
        `No articles were published on ${targetDate} — skipping the newsletter draft. Nothing to send today.\n`
    );
    return;
  }

  const destPath = path.join(NEWSLETTER_DIR, `${targetDate}.md`);
  if (fs.existsSync(destPath) && !args.force) {
    fail(`A newsletter draft for ${targetDate} already exists at content/newsletters/${targetDate}.md. Re-run with --force to overwrite.`);
  }

  const body = buildNewsletterMarkdown(targetDate, articles);
  const frontmatter = [
    "---",
    `date: "${targetDate}"`,
    "status: draft",
    `generatedAt: "${new Date().toISOString()}"`,
    `articleCount: ${articles.length}`,
    "---",
    "",
  ].join("\n");

  fs.mkdirSync(NEWSLETTER_DIR, { recursive: true });
  fs.writeFileSync(destPath, frontmatter + body);

  console.log(`\nBuilt newsletter draft: content/newsletters/${targetDate}.md (${articles.length} article(s), status: draft)`);
  console.log("Review it, then copy the Markdown body into Beehiiv yourself — nothing was sent or published.\n");
}

main();
