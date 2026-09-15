import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import type { Article, ArticleImage, ArticleStatus, Language } from "@/lib/types";
import { getCategoryBySlug } from "@/lib/data/categories";

/**
 * Content system: one Markdown file per article under content/articles/,
 * with YAML frontmatter for structured fields and the Markdown body as the
 * article text. This is the MVP's entire "CMS" — no database, no admin UI.
 * See CONTENT_STRATEGY.md / the project's content-system report for the
 * authoring workflow (create file → review → set status: published).
 *
 * Frontmatter authoring keys map to the runtime Article shape as follows:
 *   title    -> headline
 *   category -> categorySlug
 * All other keys share the same name as their Article field.
 */

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");

interface RawFrontmatter {
  title?: unknown;
  slug?: unknown;
  category?: unknown;
  language?: unknown;
  summary?: unknown;
  author?: unknown;
  publishedAt?: unknown;
  updatedAt?: unknown;
  source?: unknown;
  sourceUrl?: unknown;
  tags?: unknown;
  featured?: unknown;
  status?: unknown;
  featuredImage?: unknown;
}

function readArticleFiles(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
}

function requireString(value: unknown, field: string, file: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`content/articles/${file}: missing or invalid required field "${field}"`);
  }
  return value;
}

function parseFeaturedImage(value: unknown, file: string): ArticleImage | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "object") {
    throw new Error(`content/articles/${file}: "featuredImage" must be an object or null`);
  }
  const img = value as Record<string, unknown>;
  const type = img.type;
  const usage = img.usage;
  return {
    src: requireString(img.src, "featuredImage.src", file),
    alt: requireString(img.alt, "featuredImage.alt", file),
    caption: typeof img.caption === "string" ? img.caption : undefined,
    type:
      type === "photograph" ||
      type === "illustration" ||
      type === "ai-generated-illustration" ||
      type === "placeholder"
        ? type
        : undefined,
    usage: usage === "illustrative" || usage === "documentary" ? usage : undefined,
    generatedAt: typeof img.generatedAt === "string" ? img.generatedAt : undefined,
    provider: typeof img.provider === "string" ? img.provider : undefined,
    promptVersion: typeof img.promptVersion === "string" ? img.promptVersion : undefined,
  };
}

function parseArticleFile(filename: string): Article {
  const fullPath = path.join(CONTENT_DIR, filename);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw) as unknown as { data: RawFrontmatter; content: string };

  const slug = requireString(data.slug, "slug", filename);
  const headline = requireString(data.title, "title", filename);
  const categorySlug = requireString(data.category, "category", filename);
  const language = requireString(data.language, "language", filename) as Language;
  const summary = requireString(data.summary, "summary", filename);
  const author = requireString(data.author, "author", filename);
  const publishedAt = requireString(data.publishedAt, "publishedAt", filename);
  const status = requireString(data.status, "status", filename) as ArticleStatus;

  if (language !== "ne" && language !== "en") {
    throw new Error(`content/articles/${filename}: "language" must be "ne" or "en"`);
  }
  if (status !== "draft" && status !== "published") {
    throw new Error(`content/articles/${filename}: "status" must be "draft" or "published"`);
  }
  if (!getCategoryBySlug(categorySlug)) {
    throw new Error(
      `content/articles/${filename}: unknown category "${categorySlug}" — check src/lib/data/categories.ts`
    );
  }
  if (Number.isNaN(new Date(publishedAt).getTime())) {
    throw new Error(`content/articles/${filename}: "publishedAt" is not a valid date`);
  }

  const updatedAt = typeof data.updatedAt === "string" ? data.updatedAt : undefined;
  const source = typeof data.source === "string" ? data.source : undefined;
  const sourceUrl = typeof data.sourceUrl === "string" ? data.sourceUrl : undefined;
  const tags = Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === "string") : [];
  const featured = data.featured === true;

  return {
    slug,
    headline,
    summary,
    bodyHtml: marked.parse(content.trim(), { async: false }) as string,
    bodyRaw: content.trim(),
    categorySlug,
    language,
    publishedAt,
    updatedAt,
    author,
    source,
    sourceUrl,
    featuredImage: parseFeaturedImage(data.featuredImage, filename),
    tags,
    featured,
    status,
  };
}

/**
 * Reads content/articles/*.md fresh on every call rather than caching —
 * at MVP article volumes this costs a few milliseconds and keeps `next dev`
 * showing new/edited articles immediately without a server restart.
 */
function loadAllArticles(): Article[] {
  const seenSlugs = new Set<string>();
  const parsed = readArticleFiles().map((filename) => {
    const article = parseArticleFile(filename);
    if (seenSlugs.has(article.slug)) {
      throw new Error(`Duplicate article slug "${article.slug}" — check content/articles/${filename}`);
    }
    seenSlugs.add(article.slug);
    return article;
  });
  return sortByRecency(parsed);
}

function sortByRecency(list: Article[]): Article[] {
  return [...list].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/**
 * The only place draft filtering happens — every exported query the
 * *public site* uses goes through this. The sole exception is
 * getAllArticlesIncludingDrafts(), used only by internal-only tooling
 * (the /newsroom dashboard) that deliberately needs to see drafts too —
 * never use that one for anything the public site renders.
 */
function getPublishedArticles(): Article[] {
  return loadAllArticles().filter((a) => a.status === "published");
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getPublishedArticles().find((a) => a.slug === slug);
}

export function getArticlesByCategory(categorySlug: string): Article[] {
  return getPublishedArticles().filter((a) => a.categorySlug === categorySlug);
}

export function getLatestArticles(limit?: number): Article[] {
  const published = getPublishedArticles();
  return limit ? published.slice(0, limit) : published;
}

export function getFeaturedArticles(limit = 4): Article[] {
  return getPublishedArticles()
    .filter((a) => a.featured)
    .slice(0, limit);
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  return getPublishedArticles()
    .filter((a) => a.slug !== article.slug && a.categorySlug === article.categorySlug)
    .slice(0, limit);
}

export function searchArticles(query: string): Article[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return getPublishedArticles().filter((a) =>
    [a.headline, a.summary, a.bodyRaw].join(" ").toLowerCase().includes(normalized)
  );
}

/** All published articles (e.g. for sitemap generation). */
export function getAllPublishedArticles(): Article[] {
  return getPublishedArticles();
}

/**
 * Every article regardless of status (draft or published) — for
 * internal-only editorial tooling (the /newsroom dashboard) that needs to
 * see drafts, never for anything rendered on the public site. That
 * dashboard is itself gated to non-production, same as
 * src/app/review/images/page.tsx.
 */
export function getAllArticlesIncludingDrafts(): Article[] {
  return loadAllArticles();
}
