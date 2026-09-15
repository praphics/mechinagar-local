/**
 * Server-only, read-only: computes the /newsroom dashboard's "what needs my
 * attention today" layer — workflow-state breakdown, the attention queue,
 * and the overall editorial-readiness state. Pure aggregation over
 * src/lib/newsroom/{state,queue,newsletterReview,beehiivReview}.ts — never
 * writes anything, never invents a state those modules don't already
 * produce from real data.
 */

import { getNewsroomState, type WorkflowState } from "./state";
import { getArticleReviewCards } from "./queue";
import { getLatestNewsletterReview, type NewsletterReview } from "./newsletterReview";
import { getBeehiivReview, type BeehiivReview } from "./beehiivReview";

export interface WorkflowCounts {
  byState: Record<WorkflowState, number>;
  notTracked: number;
  totalArticles: number;
}

export function getWorkflowCounts(): WorkflowCounts {
  const state = getNewsroomState();
  const cards = getArticleReviewCards();

  const byState: Record<WorkflowState, number> = {
    DISCOVERED: 0,
    FACT_CHECKED: 0,
    DRAFT_READY: 0,
    APPROVED: 0,
    PUBLISHED: 0,
    REJECTED: 0,
    BLOCKED: 0,
  };
  for (const story of Object.values(state.stories)) {
    byState[story.workflowState] += 1;
  }

  return {
    byState,
    notTracked: cards.filter((c) => c.workflowState === null).length,
    totalArticles: cards.length,
  };
}

export interface AttentionItem {
  severity: "warning" | "info";
  message: string;
  href: string | null;
}

export function getAttentionQueue(): AttentionItem[] {
  const items: AttentionItem[] = [];
  const cards = getArticleReviewCards();

  for (const card of cards) {
    // Only in-flight stories (not yet published/rejected) warrant attention — a
    // published article that predates workflow tracking needs no action today.
    const inFlight = card.workflowState !== null && card.workflowState !== "PUBLISHED" && card.workflowState !== "REJECTED";
    if (!inFlight) continue;

    if (card.evidence?.symbol === "⚠") {
      items.push({ severity: "warning", message: `Evidence required — "${card.title}"`, href: `/newsroom/${card.slug}` });
    }
    if (card.factCheck && !card.factCheck.passed) {
      items.push({ severity: "warning", message: `Fact-check incomplete — "${card.title}"`, href: `/newsroom/${card.slug}` });
    }
    if (card.imageDecision === "unresolved") {
      items.push({ severity: "warning", message: `Image requires human decision — "${card.title}"`, href: `/newsroom/${card.slug}` });
    }
    if (card.workflowState === "BLOCKED") {
      items.push({
        severity: "warning",
        message: `Story blocked — "${card.title}"${card.safetyIssues.length ? `: ${card.safetyIssues.join("; ")}` : ""}`,
        href: `/newsroom/${card.slug}`,
      });
    } else if (card.workflowState === "DRAFT_READY" || card.workflowState === "FACT_CHECKED" || card.workflowState === "DISCOVERED") {
      items.push({ severity: "info", message: `Article awaiting approval — "${card.title}"`, href: `/newsroom/${card.slug}` });
    }
  }

  const newsletter = getLatestNewsletterReview();
  if (newsletter) {
    items.push({ severity: "info", message: `Newsletter awaiting review — ${newsletter.date}`, href: null });
    for (const issue of newsletter.potentialIssues) {
      items.push({ severity: "warning", message: `Newsletter (${newsletter.date}): ${issue}`, href: null });
    }

    const beehiiv = getBeehiivReview(newsletter.date);
    if (beehiiv.state !== "VERIFIED") {
      items.push({ severity: "warning", message: `Beehiiv draft not verified — ${newsletter.date} (${beehiiv.state})`, href: null });
    }
  }

  return items;
}

export type EditorialReadiness = "NOT READY" | "READY FOR EDITORIAL REVIEW" | "READY FOR BEEHIIV DRAFT" | "BEEHIIV DRAFT VERIFIED";

/**
 * Derived strictly from real, persisted state — never a hardcoded value,
 * and deliberately has no "READY TO SEND" state (this system never sends
 * anything, see .claude/newsletter-beehiiv/README.md):
 *
 *   NOT READY                 — no newsletter has been generated yet for
 *                                the latest tracked date.
 *   READY FOR EDITORIAL REVIEW — newsletter exists, but at least one
 *                                in-flight story or the newsletter itself
 *                                has an open issue an editor must look at.
 *   READY FOR BEEHIIV DRAFT    — newsletter exists and is clean, but its
 *                                Beehiiv draft isn't confirmed-safe yet
 *                                (none created, created-but-unverified, or
 *                                Beehiiv reported something other than
 *                                "draft").
 *   BEEHIIV DRAFT VERIFIED     — Beehiiv itself confirmed (via a real,
 *                                read-only GET) that the draft's status is
 *                                still "draft" — i.e. genuinely NOT SENT.
 */
export function getEditorialReadiness(newsletter: NewsletterReview | null, attention: AttentionItem[], beehiiv: BeehiivReview | null): EditorialReadiness {
  if (!newsletter) return "NOT READY";

  const hasWarnings = attention.some((a) => a.severity === "warning" && !a.message.startsWith("Beehiiv draft not verified"));
  if (hasWarnings) return "READY FOR EDITORIAL REVIEW";

  if (!beehiiv || beehiiv.state !== "VERIFIED") return "READY FOR BEEHIIV DRAFT";

  return "BEEHIIV DRAFT VERIFIED";
}
