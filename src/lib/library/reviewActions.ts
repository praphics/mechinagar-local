"use server";

/**
 * Server Actions backing the local /review/images dashboard. These are the
 * only way the running app can write to manifest.json outside the offline
 * download script — and only from that one internal page.
 *
 * Not a public admin API: there is no discoverable REST route with a
 * filename parameter. Next.js resolves a Server Action as a private,
 * function-specific RPC, and every call still re-validates its
 * (category, filename) pair against the manifest itself before writing
 * anything (see setLibraryImageReviewStatus). As a second, independent
 * guard, every action refuses to run at all once NODE_ENV=production —
 * the same gate used for the dev-mode banner — so this capability cannot
 * reach a real production deploy even if the route were somehow linked to.
 */

import { revalidatePath } from "next/cache";
import { setLibraryImageReviewStatus } from "./manifest";
import type { LibraryReviewStatus } from "./types";

const REVIEW_PATH = "/review/images";

function assertNotProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Image review actions are disabled in production.");
  }
}

async function setStatus(category: string, filename: string, status: LibraryReviewStatus) {
  assertNotProduction();
  const updated = setLibraryImageReviewStatus(category, filename, status);
  revalidatePath(REVIEW_PATH);
  return { ok: true as const, filename: updated.filename, approved: updated.approved };
}

export async function approveImage(category: string, filename: string) {
  return setStatus(category, filename, "approved");
}

export async function rejectImage(category: string, filename: string) {
  return setStatus(category, filename, "rejected");
}

/** Lets a reviewer undo a rejection (or re-open an approved image) without hand-editing JSON. */
export async function resetImageToPending(category: string, filename: string) {
  return setStatus(category, filename, "pending");
}
