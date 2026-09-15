import type { Alert } from "@/lib/types";

/**
 * MVP has no genuine, verified alert to publish — HOMEPAGE_SPEC.md §2.1
 * requires the alert component to be completely absent (not a hidden or
 * greyed-out state) whenever there is nothing real to show. Set this to a
 * populated Alert object only when there is a real, sourced, urgent item.
 */
export const currentAlert: Alert | null = null;
