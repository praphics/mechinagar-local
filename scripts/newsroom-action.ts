/**
 * Editorial-time CLI tool — the safety-critical state machine behind the
 * local newsroom's human approval/publication gate. This is a standalone
 * script, not part of the running website: nothing in the app imports or
 * invokes it automatically.
 *
 * Run with Node's built-in TypeScript support — no extra packages needed:
 *
 *   node --experimental-strip-types scripts/newsroom-action.ts <verb> [args]
 *   npm run newsroom -- <verb> [args]
 *
 * Verbs:
 *   start-report --date YYYY-MM-DD
 *   record <slug> --position N --title "..." [--factCheckPassed]
 *          [--factCheckSummary "..."] [--imageDecision "..."]
 *          [--evidenceRequired] [--state DISCOVERED|FACT_CHECKED|DRAFT_READY|BLOCKED]
 *   approve <position-or-slug>
 *   reject  <position-or-slug> [--reason "..."]
 *   publish <position-or-slug>
 *   review  <position-or-slug>
 *   status
 *
 * WHY THIS IS A SCRIPT, NOT JUST SKILL INSTRUCTIONS: the workflow states
 * (DISCOVERED/FACT_CHECKED/DRAFT_READY/APPROVED/PUBLISHED/REJECTED/BLOCKED)
 * are newsroom-workflow states, kept entirely in
 * .claude/newsroom/state.json — they never replace or touch the real
 * article `status` field (draft/published) in content/articles/*.md,
 * except for the one line `publish` is explicitly allowed to change (see
 * that verb below). Making approve/reject/publish a script rather than
 * something done by conversational judgment each time means every safety
 * gate in this file is *mechanically enforced* — it can't be skipped by
 * an oversight the way a purely conversational check could be. This
 * mirrors this project's existing pattern of putting safety-critical file
 * mutations behind a script with hard-coded guards (see
 * scripts/generate-image.ts's slug-collision check,
 * scripts/ingest-evidence.ts's overwrite guard).
 *
 * Never calls a network API, never touches manifest.json or any image
 * file, never generates an image, never sends a newsletter. `publish` is
 * the ONLY verb that ever writes to content/articles/*.md, and it only
 * ever changes a single line (`status: draft` -> `status: published`) on
 * the one article it was explicitly told to publish — never more than one
 * article per invocation.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");
const STATE_PATH = path.join(process.cwd(), ".claude", "newsroom", "state.json");

type WorkflowState =
  | "DISCOVERED"
  | "FACT_CHECKED"
  | "DRAFT_READY"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED"
  | "BLOCKED";

interface ReportItem {
  position: number;
  slug: string;
  title: string;
}

interface CurrentReport {
  reportId: string;
  date: string;
  generatedAt: string;
  items: ReportItem[];
}

interface HistoryEntry {
  at: string;
  event: string;
  note: string;
}

interface StoryRecord {
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
  history: HistoryEntry[];
}

interface NewsroomState {
  currentReport: CurrentReport | null;
  stories: Record<string, StoryRecord>;
}

function fail(message: string): never {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

function loadState(): NewsroomState {
  if (!fs.existsSync(STATE_PATH)) return { currentReport: null, stories: {} };
  const raw = fs.readFileSync(STATE_PATH, "utf8").trim();
  if (!raw) return { currentReport: null, stories: {} };
  return JSON.parse(raw) as NewsroomState;
}

function saveState(state: NewsroomState): void {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}

function newReportId(): string {
  return `rep-${Date.now().toString(36)}`;
}

/** Same shape of guard as this project's other scripts' filename/slug checks. */
function assertSafeSlug(slug: string): void {
  if (!slug || slug.includes("/") || slug.includes("\\") || slug.includes("..")) {
    fail(`Invalid slug "${slug}".`);
  }
}

function findArticleFile(slug: string): { file: string; fullPath: string; raw: string } | null {
  if (!fs.existsSync(CONTENT_DIR)) return null;
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const fullPath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(raw) as unknown as { data: Record<string, unknown> };
    if (data.slug === slug) return { file, fullPath, raw };
  }
  return null;
}

/**
 * Resolves "1", "2", ... against the CURRENT report's positions, or an
 * exact slug directly (which always bypasses position ambiguity and thus
 * also serves as the stale-report override). This is the one place
 * "story N from the report" ever becomes an exact slug — nothing else in
 * this script accepts a bare number.
 */
function resolvePositionOrSlug(state: NewsroomState, arg: string): string {
  if (!/^\d+$/.test(arg)) {
    assertSafeSlug(arg);
    return arg;
  }

  const position = Number(arg);
  if (!state.currentReport) {
    fail(
      `"${arg}" refers to a position, but there is no current report on record. ` +
        `Run /local-news to generate one, or specify the exact slug instead.`
    );
  }
  const item = state.currentReport.items.find((i) => i.position === position);
  if (!item) {
    fail(
      `Position ${position} does not exist in the current report ` +
        `(report ${state.currentReport.reportId}, ${state.currentReport.items.length} item(s)). ` +
        `Run /local-news again to refresh the report, or specify the exact slug instead.`
    );
  }

  // Stale-report protection: the story's own record must still point at
  // THIS report. If a newer report was generated since this story was
  // recorded, the position no longer reliably means what the editor thinks.
  const story = state.stories[item.slug];
  if (!story || story.reportId !== state.currentReport.reportId) {
    fail(
      `Position ${position} ("${item.title}") was resolved from an older report than what's ` +
        `currently on record — this looks like a stale reference. Re-run /local-news to see the ` +
        `current report, or specify the exact slug "${item.slug}" directly if you're sure.`
    );
  }

  return item.slug;
}

function parseArgFlags(argv: string[]): { positional: string[]; flags: Record<string, string | boolean> } {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const name = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[name] = next;
        i++;
      } else {
        flags[name] = true;
      }
      continue;
    }
    positional.push(arg);
  }
  return { positional, flags };
}

function cmdStartReport(flags: Record<string, string | boolean>): void {
  const date = typeof flags.date === "string" ? flags.date : undefined;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fail("--date YYYY-MM-DD is required for start-report.");
  }
  const state = loadState();
  state.currentReport = { reportId: newReportId(), date, generatedAt: new Date().toISOString(), items: [] };
  saveState(state);
  console.log(`Started report ${state.currentReport.reportId} for ${date}.`);
}

function cmdRecord(slug: string, flags: Record<string, string | boolean>): void {
  assertSafeSlug(slug);
  const state = loadState();
  if (!state.currentReport) fail("No current report — run `start-report` first.");

  const position = typeof flags.position === "string" ? Number(flags.position) : NaN;
  if (!Number.isInteger(position) || position < 1) fail("--position <N> (integer >= 1) is required.");
  const title = typeof flags.title === "string" ? flags.title : "";
  if (!title) fail("--title is required.");

  const validStates: WorkflowState[] = ["DISCOVERED", "FACT_CHECKED", "DRAFT_READY", "BLOCKED"];
  const requestedState = typeof flags.state === "string" ? (flags.state as WorkflowState) : undefined;
  if (requestedState && !validStates.includes(requestedState)) {
    fail(`--state must be one of: ${validStates.join(", ")}`);
  }

  const factCheckPassed = flags.factCheckPassed === true;
  const imageDecision = typeof flags.imageDecision === "string" ? flags.imageDecision : "";
  const evidenceRequired = flags.evidenceRequired === true;

  const workflowState: WorkflowState =
    requestedState ?? (evidenceRequired ? "BLOCKED" : factCheckPassed && imageDecision ? "DRAFT_READY" : "FACT_CHECKED");

  state.currentReport.items = state.currentReport.items.filter((i) => i.position !== position);
  state.currentReport.items.push({ position, slug, title });
  state.currentReport.items.sort((a, b) => a.position - b.position);

  const now = new Date().toISOString();
  state.stories[slug] = {
    workflowState,
    reportId: state.currentReport.reportId,
    title,
    factCheckPassed,
    factCheckSummary: typeof flags.factCheckSummary === "string" ? flags.factCheckSummary : "",
    imageDecision,
    evidenceRequired,
    safetyIssues: [],
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    publishedAt: null,
    history: [{ at: now, event: "recorded", note: workflowState }],
  };

  saveState(state);
  console.log(`Recorded position ${position}: "${title}" (${slug}) — state: ${workflowState}`);
}

function cmdApprove(arg: string): void {
  const state = loadState();
  const slug = resolvePositionOrSlug(state, arg);
  const story = state.stories[slug];
  if (!story) fail(`No workflow record for "${slug}". Run /local-news to generate one first.`);

  const article = findArticleFile(slug);
  if (!article) fail(`No article file found for slug "${slug}" — verify article exists FAILED.`);

  const { data } = matter(article.raw) as unknown as { data: Record<string, unknown> };
  if (data.status !== "draft") {
    fail(`Article "${slug}" has status "${String(data.status)}", not "draft" — verify article status is draft FAILED.`);
  }

  if (story.workflowState === "PUBLISHED") fail(`"${slug}" is already PUBLISHED — nothing to approve.`);
  if (story.workflowState === "APPROVED") fail(`"${slug}" is already APPROVED.`);
  if (story.workflowState === "REJECTED") {
    fail(`"${slug}" was REJECTED (${story.rejectionReason ?? "no reason given"}) — re-run /local-news to reconsider it, rather than approving a rejected record directly.`);
  }
  if (story.workflowState === "BLOCKED" || story.evidenceRequired) {
    fail(`"${slug}" is BLOCKED on unresolved evidence — verify no blocking evidence exists FAILED. See its EVIDENCE REQUIRED / PDF EVIDENCE REQUIRED entry.`);
  }
  if (!story.factCheckPassed) fail(`"${slug}" has no passing fact-check on record — verify fact-check status FAILED.`);
  if (!story.imageDecision) fail(`"${slug}" has no image decision on record — verify image decision exists FAILED.`);
  if (story.workflowState !== "DRAFT_READY") {
    fail(`"${slug}" is in state ${story.workflowState}, not DRAFT_READY — cannot approve yet.`);
  }

  const now = new Date().toISOString();
  story.workflowState = "APPROVED";
  story.approvedAt = now;
  story.history.push({ at: now, event: "approved", note: "" });
  saveState(state);

  console.log(`\nAPPROVED: "${story.title}" (${slug})`);
  console.log(`Newsroom workflow state is now APPROVED. Article file status is UNCHANGED (still "draft").`);
  console.log(`No article was published. Publishing requires a separate, explicit "publish" action.\n`);
}

function cmdReject(arg: string, flags: Record<string, string | boolean>): void {
  const state = loadState();
  const slug = resolvePositionOrSlug(state, arg);
  const story = state.stories[slug];
  if (!story) fail(`No workflow record for "${slug}".`);

  if (story.workflowState === "PUBLISHED") {
    fail(`"${slug}" is already PUBLISHED — this command does not unpublish or modify a published article.`);
  }

  const reason = typeof flags.reason === "string" ? flags.reason : "no reason given";
  const now = new Date().toISOString();
  story.workflowState = "REJECTED";
  story.rejectedAt = now;
  story.rejectionReason = reason;
  story.history.push({ at: now, event: "rejected", note: reason });
  saveState(state);

  const article = findArticleFile(slug);
  console.log(`\nREJECTED: "${story.title}" (${slug}) — reason: ${reason}`);
  console.log(`Newsroom workflow state is now REJECTED.`);
  console.log(
    article
      ? `The article file content/articles/${article.file} was NOT deleted or modified — the editorial work is preserved on disk.`
      : `(No article file exists yet for this story.)`
  );
  console.log(`No article was published.\n`);
}

function cmdPublish(arg: string): void {
  const state = loadState();
  const slug = resolvePositionOrSlug(state, arg);
  const story = state.stories[slug];
  if (!story) fail(`No workflow record for "${slug}".`);

  // 1. Resolve the exact article.
  const article = findArticleFile(slug);
  if (!article) fail(`No article file found for slug "${slug}" — cannot publish.`);

  // 2. Confirm it is the article the editor approved.
  if (story.workflowState !== "APPROVED") {
    fail(
      `"${slug}" is in state ${story.workflowState}, not APPROVED — publishing requires prior explicit approval ` +
        `("approve ${slug}") before "publish" will act on it.`
    );
  }

  // 3. Confirm status is still draft (re-read fresh from disk, not cached).
  const { data } = matter(article.raw) as unknown as { data: Record<string, unknown> };
  if (data.status !== "draft") {
    fail(`Article "${slug}" has status "${String(data.status)}", not "draft" — refusing to publish.`);
  }

  // 4. Confirm fact-check passed.
  if (!story.factCheckPassed) fail(`"${slug}" has no passing fact-check on record — refusing to publish.`);

  // 5. Confirm no blocking evidence exists.
  if (story.evidenceRequired) fail(`"${slug}" still has unresolved evidence requirements — refusing to publish.`);

  // 6. Confirm image decision exists.
  if (!story.imageDecision) fail(`"${slug}" has no image decision on record — refusing to publish.`);

  // 7. Confirm no unresolved editorial safety issue.
  if (story.safetyIssues.length > 0) {
    fail(`"${slug}" has unresolved safety issue(s): ${story.safetyIssues.join("; ")} — refusing to publish.`);
  }

  // 8. Show a concise final confirmation summary.
  console.log(`\n--- Publication confirmation: ${slug} ---`);
  console.log(`Title:          ${String(data.title ?? story.title)}`);
  console.log(`Category:       ${String(data.category ?? "")}`);
  console.log(`Source:         ${String(data.source ?? "")}`);
  console.log(`Source URL:     ${String(data.sourceUrl ?? "none")}`);
  console.log(`Fact-check:     ${story.factCheckSummary || "(passed)"}`);
  console.log(`Image decision: ${story.imageDecision}`);
  console.log(`Current status: draft -> published`);
  console.log(`-------------------------------------------\n`);

  // Only now, after every gate above passed: the single-field status edit.
  const updatedRaw = article.raw.replace(/^status: draft$/m, "status: published");
  if (updatedRaw === article.raw) {
    fail(`Could not find a literal "status: draft" line to replace in ${article.file} — refusing to guess.`);
  }
  fs.writeFileSync(article.fullPath, updatedRaw);

  const now = new Date().toISOString();
  story.workflowState = "PUBLISHED";
  story.publishedAt = now;
  story.history.push({ at: now, event: "published", note: "" });
  saveState(state);

  console.log(`PUBLISHED: content/articles/${article.file} — status is now "published".`);
  console.log(`Only this one article was published. Nothing else was changed.\n`);
}

function cmdReview(arg: string): void {
  const state = loadState();
  const slug = resolvePositionOrSlug(state, arg);
  const story = state.stories[slug];
  const article = findArticleFile(slug);

  console.log(`\n=== Review: ${slug} ===\n`);
  if (!article) {
    console.log("No article file exists yet for this story.");
  } else {
    const { data, content } = matter(article.raw) as unknown as { data: Record<string, unknown>; content: string };
    console.log(`Title:       ${String(data.title ?? "")}`);
    console.log(`Summary:     ${String(data.summary ?? "")}`);
    console.log(`Category:    ${String(data.category ?? "")}`);
    console.log(`Source:      ${String(data.source ?? "")}`);
    console.log(`Source URL:  ${String(data.sourceUrl ?? "")}`);
    console.log(`Status:      ${String(data.status ?? "")}  (article frontmatter — unaffected by this review)`);
    console.log(`\n--- Body ---\n${content.trim()}\n------------\n`);
  }

  if (story) {
    console.log(`Workflow state:      ${story.workflowState}`);
    console.log(`Fact-check:          ${story.factCheckSummary || (story.factCheckPassed ? "(passed)" : "(not passed)")}`);
    console.log(`Image decision:      ${story.imageDecision || "(none recorded)"}`);
    console.log(`Evidence required:   ${story.evidenceRequired ? "YES — blocked" : "No"}`);
    console.log(`Approved at:         ${story.approvedAt ?? "(not approved)"}`);
    console.log(`Published at:        ${story.publishedAt ?? "(not published)"}`);
  } else {
    console.log("No newsroom workflow record for this story.");
  }
  console.log(`\nThis is a read-only review — nothing was modified by running it.\n`);
}

function cmdStatus(): void {
  const state = loadState();
  if (!state.currentReport) {
    console.log("No current report on record. Run /local-news to generate one.");
    return;
  }
  console.log(`\nCurrent report: ${state.currentReport.reportId} (${state.currentReport.date})`);
  for (const item of state.currentReport.items) {
    const story = state.stories[item.slug];
    console.log(`  ${item.position}. ${item.title} [${item.slug}] — ${story ? story.workflowState : "(no record)"}`);
  }
  console.log("");
}

async function main(): Promise<void> {
  const [verb, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgFlags(rest);

  switch (verb) {
    case "start-report":
      cmdStartReport(flags);
      break;
    case "record":
      if (!positional[0]) fail("Usage: record <slug> --position N --title \"...\" ...");
      cmdRecord(positional[0], flags);
      break;
    case "approve":
      if (!positional[0]) fail("Usage: approve <position-or-slug>");
      cmdApprove(positional[0]);
      break;
    case "reject":
      if (!positional[0]) fail("Usage: reject <position-or-slug> [--reason \"...\"]");
      cmdReject(positional[0], flags);
      break;
    case "publish":
      if (!positional[0]) fail("Usage: publish <position-or-slug>");
      cmdPublish(positional[0]);
      break;
    case "review":
      if (!positional[0]) fail("Usage: review <position-or-slug>");
      cmdReview(positional[0]);
      break;
    case "status":
      cmdStatus();
      break;
    default:
      console.log(
        "Usage: newsroom-action.ts <start-report|record|approve|reject|publish|review|status> [args]\n" +
          "See scripts/newsroom-action.ts's header comment for full usage."
      );
      process.exit(verb ? 1 : 0);
  }
}

main();
