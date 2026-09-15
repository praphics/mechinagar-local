/**
 * Server-only, read-only: reads .claude/newsroom/state.json — the same
 * file scripts/newsroom-action.ts owns. This module exists so the
 * /newsroom dashboard can display that state without duplicating its
 * logic; it never writes to the file. All mutation (approve/reject/
 * publish/record) happens exclusively through that CLI script — see its
 * header comment and .claude/newsroom/README.md for why.
 */

import fs from "node:fs";
import path from "node:path";

const STATE_PATH = path.join(process.cwd(), ".claude", "newsroom", "state.json");

export type WorkflowState =
  | "DISCOVERED"
  | "FACT_CHECKED"
  | "DRAFT_READY"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED"
  | "BLOCKED";

export interface NewsroomReportItem {
  position: number;
  slug: string;
  title: string;
}

export interface NewsroomReport {
  reportId: string;
  date: string;
  generatedAt: string;
  items: NewsroomReportItem[];
}

export interface NewsroomHistoryEntry {
  at: string;
  event: string;
  note: string;
}

export interface NewsroomStory {
  workflowState: WorkflowState;
  reportId: string;
  title: string;
  factCheckPassed: boolean;
  factCheckSummary: string;
  imageDecision: string;
  evidenceRequired: boolean;
  safetyIssues: string[];
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  publishedAt: string | null;
  history: NewsroomHistoryEntry[];
}

export interface NewsroomState {
  currentReport: NewsroomReport | null;
  stories: Record<string, NewsroomStory>;
}

const EMPTY_STATE: NewsroomState = { currentReport: null, stories: {} };

/** Read-only — never call fs.writeFileSync on STATE_PATH from this module or anything that imports it. */
export function getNewsroomState(): NewsroomState {
  if (!fs.existsSync(STATE_PATH)) return EMPTY_STATE;
  const raw = fs.readFileSync(STATE_PATH, "utf8").trim();
  if (!raw) return EMPTY_STATE;
  return JSON.parse(raw) as NewsroomState;
}

export function getStoryBySlug(slug: string): NewsroomStory | undefined {
  return getNewsroomState().stories[slug];
}
