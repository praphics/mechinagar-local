/**
 * Server-only, read-only: joins .claude/newsroom/state.json's current
 * report against the real article files (content/articles/*.md) so the
 * /newsroom dashboard shows one coherent picture instead of the editor
 * having to cross-reference two sources by hand. Never writes anything —
 * see src/lib/newsroom/state.ts's header for why mutation only ever
 * happens through scripts/newsroom-action.ts.
 */

import { getAllArticlesIncludingDrafts } from "@/lib/content/articles";
import { getNewsroomState, type NewsroomReport, type WorkflowState } from "./state";
import type { Article } from "@/lib/types";

export type EvidenceSymbol = "✓" | "⚠" | "✗";

export interface EvidenceStatus {
  symbol: EvidenceSymbol;
  label: string;
}

export interface QueueItem {
  position: number;
  slug: string;
  title: string;
  category: string | null;
  source: string | null;
  workflowState: WorkflowState;
  articleStatus: "draft" | "published" | "not-created";
  factCheckPassed: boolean;
  factCheckSummary: string;
  evidence: EvidenceStatus;
  imageDecision: string;
  approvalLabel: string;
}

/**
 * "✗ Evidence insufficient" is deliberately unreachable with today's data
 * model: newsroom state only tracks a per-story evidenceRequired boolean,
 * not a link to a specific .claude/evidence/processed/<id>/record.json
 * and its extractionStatus. Distinguishing "never asked for evidence" from
 * "asked, something was supplied, but it's still not readable" would need
 * that link added to the story record — out of scope for this dashboard
 * milestone (observability only), and not invented here per "do not
 * invent additional states unless the existing implementation requires
 * them." Only ✓/⚠ are ever actually produced right now.
 */
export function evidenceStatusFor(evidenceRequired: boolean): EvidenceStatus {
  if (evidenceRequired) {
    return {
      symbol: "⚠",
      label: "EVIDENCE REQUIRED — original attachment needed before article can proceed.",
    };
  }
  return { symbol: "✓", label: "Evidence complete" };
}

export function approvalLabelFor(story: { approvedAt: string | null; rejectedAt: string | null; rejectionReason: string | null; publishedAt: string | null }): string {
  if (story.publishedAt) return `Published ${story.publishedAt}`;
  if (story.rejectedAt) return `Rejected ${story.rejectedAt} — ${story.rejectionReason ?? "no reason given"}`;
  if (story.approvedAt) return `Approved ${story.approvedAt} (not yet published)`;
  return "Not yet approved";
}

export interface NewsroomQueue {
  report: NewsroomReport | null;
  items: QueueItem[];
}

export function getNewsroomQueue(): NewsroomQueue {
  const state = getNewsroomState();
  const report = state.currentReport;
  if (!report) return { report: null, items: [] };

  const articlesBySlug = new Map<string, Article>(
    getAllArticlesIncludingDrafts().map((a) => [a.slug, a] as const)
  );

  const items: QueueItem[] = report.items
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((item) => {
      const story = state.stories[item.slug];
      const article = articlesBySlug.get(item.slug);

      return {
        position: item.position,
        slug: item.slug,
        title: article?.headline ?? story?.title ?? item.title,
        category: article?.categorySlug ?? null,
        source: article?.source ?? null,
        workflowState: story?.workflowState ?? "DISCOVERED",
        articleStatus: article ? article.status : "not-created",
        factCheckPassed: story?.factCheckPassed ?? false,
        factCheckSummary: story?.factCheckSummary ?? "(not recorded)",
        evidence: evidenceStatusFor(story?.evidenceRequired ?? false),
        imageDecision: story?.imageDecision || "unresolved",
        approvalLabel: story ? approvalLabelFor(story) : "(no workflow record)",
      };
    });

  return { report, items };
}

/** Stories tracked in newsroom state that are neither published nor rejected — the "still needs a decision" list. */
export function getPendingStories(): QueueItem[] {
  return getNewsroomQueue().items.filter(
    (i) => i.workflowState !== "PUBLISHED" && i.workflowState !== "REJECTED"
  );
}

/**
 * Review card for every article on disk (content/articles/*.md), not just
 * the ones with a newsroom workflow record. Real production data has 18
 * articles but only 1 tracked story — most published articles predate the
 * newsroom workflow-tracking system entirely. For those, workflowState/
 * factCheck/evidence are explicitly `null` ("not tracked"), never a
 * fabricated ✓/PUBLISHED-implies-verified guess — see queue.ts's own
 * header comment on not inventing states the data doesn't support.
 */
export interface ArticleReviewCard {
  slug: string;
  title: string;
  category: string;
  source: string | null;
  sourceUrl: string | null;
  date: string;
  summary: string;
  articleStatus: "draft" | "published";
  workflowState: WorkflowState | null;
  factCheck: { passed: boolean; summary: string } | null;
  evidence: EvidenceStatus | null;
  imageDecision: string | null;
  approvalLabel: string;
  safetyIssues: string[];
}

export function getArticleReviewCards(): ArticleReviewCard[] {
  const state = getNewsroomState();
  const articles = getAllArticlesIncludingDrafts();

  return articles.map((article) => {
    const story = state.stories[article.slug];

    return {
      slug: article.slug,
      title: article.headline,
      category: article.categorySlug,
      source: article.source ?? null,
      sourceUrl: article.sourceUrl ?? null,
      date: article.publishedAt,
      summary: article.summary,
      articleStatus: article.status,
      workflowState: story?.workflowState ?? null,
      factCheck: story ? { passed: story.factCheckPassed, summary: story.factCheckSummary || "(not recorded)" } : null,
      evidence: story ? evidenceStatusFor(story.evidenceRequired) : null,
      imageDecision: story?.imageDecision || null,
      approvalLabel: story
        ? approvalLabelFor(story)
        : article.status === "published"
          ? "Published (predates newsroom workflow tracking — no approval record)"
          : "Not tracked in newsroom workflow",
      safetyIssues: story?.safetyIssues ?? [],
    };
  });
}
