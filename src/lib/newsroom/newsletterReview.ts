/**
 * Server-only, read-only: reads content/newsletters/*.md (built by
 * scripts/build-newsletter.ts) and recomputes, from the REAL current
 * article set, which published articles were selected into a given
 * newsletter vs. omitted — never hard-coded, always derived from
 * getAllArticlesIncludingDrafts() + the newsletter's own date. Mirrors
 * scripts/build-newsletter.ts's date-matching, sort, and limit logic
 * exactly (MAIN_STORY_LIMIT=6, BRIEF_LIMIT=5) — that script can't import
 * this module (no "@/" alias at runtime for standalone Node scripts, see
 * its header comment), so the selection rule is intentionally duplicated
 * here; keep the two in sync if that rule ever changes.
 *
 * Never writes anything, never calls Beehiiv. This is strictly a review
 * layer over files scripts/build-newsletter.ts already produced.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getAllArticlesIncludingDrafts } from "@/lib/content/articles";
import { getStoryBySlug } from "./state";
import { evidenceStatusFor } from "./queue";
import type { Article } from "@/lib/types";

const NEWSLETTER_DIR = path.join(process.cwd(), "content", "newsletters");
const NEPAL_TIMEZONE = "Asia/Kathmandu";
const MAIN_STORY_LIMIT = 6;
const BRIEF_LIMIT = 5;

function nepalDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NEPAL_TIMEZONE }).format(date);
}

export interface NewsletterStoryIntegrity {
  slug: string;
  title: string;
  status: Article["status"];
  publishedAt: string;
  source: string | null;
  factCheckStatus: string;
  evidenceStatus: string;
}

export interface NewsletterReview {
  date: string;
  generationStatus: string;
  reviewStatus: "REVIEW ONLY";
  generatedFile: string;
  generatedAt: string | null;
  contentPreview: string;
  selectedStories: NewsletterStoryIntegrity[];
  omittedStories: NewsletterStoryIntegrity[];
  sourcesSummary: string;
  excludedSummary: string;
  potentialIssues: string[];
}

function storyIntegrity(article: Article): NewsletterStoryIntegrity {
  const story = getStoryBySlug(article.slug);
  return {
    slug: article.slug,
    title: article.headline,
    status: article.status,
    publishedAt: article.publishedAt,
    source: article.source ?? null,
    factCheckStatus: story ? (story.factCheckPassed ? `Passed — ${story.factCheckSummary}` : `Not passed — ${story.factCheckSummary}`) : "Not tracked in newsroom workflow",
    evidenceStatus: story ? evidenceStatusFor(story.evidenceRequired).label : "Not tracked in newsroom workflow",
  };
}

/** Lists every content/newsletters/*.md date, newest first. */
export function listNewsletterDates(): string[] {
  if (!fs.existsSync(NEWSLETTER_DIR)) return [];
  return fs
    .readdirSync(NEWSLETTER_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort()
    .reverse();
}

export function getNewsletterReview(date: string): NewsletterReview | null {
  const filePath = path.join(NEWSLETTER_DIR, `${date}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw) as unknown as { data: Record<string, unknown>; content: string };

  const allArticles = getAllArticlesIncludingDrafts();
  const totalPublished = allArticles.filter((a) => a.status === "published").length;
  const totalDraft = allArticles.filter((a) => a.status === "draft").length;

  // Mirror scripts/build-newsletter.ts's loadPublishedArticlesForDate() + sort exactly.
  const eligible = allArticles
    .filter((a) => a.status === "published" && nepalDateString(new Date(a.publishedAt)) === date)
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  const selected = eligible.slice(0, MAIN_STORY_LIMIT + BRIEF_LIMIT);
  const omitted = eligible.slice(MAIN_STORY_LIMIT + BRIEF_LIMIT);

  const potentialIssues: string[] = [];
  const articleCount = typeof data.articleCount === "number" ? data.articleCount : null;
  if (articleCount !== null && articleCount !== selected.length) {
    potentialIssues.push(
      `Newsletter frontmatter says articleCount: ${articleCount}, but ${selected.length} published article(s) currently match this date — the file may be stale relative to the current article set. Re-run the newsletter build script to refresh it.`
    );
  }
  if (omitted.length > 0) {
    potentialIssues.push(
      `${omitted.length} published article(s) for this date were not included — the newsletter builder caps at ${MAIN_STORY_LIMIT + BRIEF_LIMIT} stories per day.`
    );
  }

  return {
    date,
    generationStatus: typeof data.status === "string" ? data.status : "(not recorded)",
    reviewStatus: "REVIEW ONLY",
    generatedFile: `content/newsletters/${date}.md`,
    generatedAt: typeof data.generatedAt === "string" ? data.generatedAt : null,
    contentPreview: content.trim(),
    selectedStories: selected.map(storyIntegrity),
    omittedStories: omitted.map(storyIntegrity),
    sourcesSummary: `Sources: ${totalPublished} published article${totalPublished === 1 ? "" : "s"} available project-wide`,
    excludedSummary: `Excluded: ${totalDraft} draft${totalDraft === 1 ? "" : "s"} (drafts are never eligible for a newsletter)`,
    potentialIssues,
  };
}

/** The most recently generated newsletter, or null if none exist yet. */
export function getLatestNewsletterReview(): NewsletterReview | null {
  const dates = listNewsletterDates();
  if (dates.length === 0) return null;
  return getNewsletterReview(dates[0]);
}
