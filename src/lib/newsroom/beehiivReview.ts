/**
 * Server-only, read-only: reads .claude/newsletter-beehiiv/state.json (the
 * LOCAL cache scripts/newsletter-beehiiv-draft.ts maintains) so the
 * /newsroom dashboard can show Beehiiv draft state without holding
 * BEEHIIV_API_KEY or making any live API call itself. See that file's
 * README for the schema and why verification is a locally-cached GET, not
 * a live call from this module. Never writes to state.json — the CLI
 * script is the only writer, per that README.
 */

import fs from "node:fs";
import path from "node:path";

const BEEHIIV_STATE_PATH = path.join(process.cwd(), ".claude", "newsletter-beehiiv", "state.json");

export type BeehiivReviewState = "NOT CREATED" | "DRAFT CREATED" | "VERIFIED" | "ERROR";

export interface BeehiivReview {
  state: BeehiivReviewState;
  draftId: string | null;
  createdAt: string | null;
  verifiedStatus: string | null;
  verifiedAt: string | null;
  previewUrl: string | null;
  /** Always false — this module has no way to send anything, and nothing in this codebase ever sets a draft to "confirmed"/"archived". Shown explicitly so the UI never has to imply otherwise. */
  sent: false;
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

function readBeehiivState(): BeehiivState {
  if (!fs.existsSync(BEEHIIV_STATE_PATH)) return { drafts: {} };
  const raw = fs.readFileSync(BEEHIIV_STATE_PATH, "utf8").trim();
  if (!raw) return { drafts: {} };
  return JSON.parse(raw) as BeehiivState;
}

/** date is the newsletter's own date key (YYYY-MM-DD), same as content/newsletters/{date}.md. */
export function getBeehiivReview(date: string): BeehiivReview {
  const entry = readBeehiivState().drafts[date];

  if (!entry) {
    return {
      state: "NOT CREATED",
      draftId: null,
      createdAt: null,
      verifiedStatus: null,
      verifiedAt: null,
      previewUrl: null,
      sent: false,
    };
  }

  let state: BeehiivReviewState;
  if (!entry.verifiedStatus) {
    state = "DRAFT CREATED"; // created, but no verification data cached yet
  } else if (entry.verifiedStatus === "draft") {
    state = "VERIFIED"; // confirmed by a real Beehiiv read: still a draft, not sent
  } else {
    state = "ERROR"; // Beehiiv reports something other than "draft" — needs human attention, see scripts/newsletter-beehiiv-draft.ts's own WARNING check
  }

  return {
    state,
    draftId: entry.beehiivDraftId,
    createdAt: entry.createdAt,
    verifiedStatus: entry.verifiedStatus ?? null,
    verifiedAt: entry.verifiedAt ?? null,
    previewUrl: entry.previewUrl ?? null,
    sent: false,
  };
}
