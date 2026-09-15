/**
 * Server-only, read-only: reads .claude/city-config.json — the single
 * source of city-specific configuration for this application. Two
 * independent consumers share this one module rather than each parsing
 * the file themselves: src/lib/library/match.ts (image-locality matching)
 * and the /newsroom dashboard (src/app/newsroom/page.tsx). Never write to
 * this file from application code; production city-config.json is edited
 * by hand or by the editorial workflow, never by the running site.
 *
 * Deliberately typed loosely (Record<string, unknown> + safe fallbacks)
 * rather than mirroring the whole city-config.json schema here — see
 * .claude/city-config.README.md for the full, self-documenting schema.
 */

import fs from "node:fs";
import path from "node:path";

const CITY_CONFIG_PATH = path.join(process.cwd(), ".claude", "city-config.json");

export interface CityConfigSummary {
  cityNameNe: string;
  cityNameEn: string;
  newsletterNameNe: string;
  newsletterNameEn: string;
}

const SUMMARY_FALLBACK: CityConfigSummary = {
  cityNameNe: "—",
  cityNameEn: "Unnamed city",
  newsletterNameNe: "—",
  newsletterNameEn: "Local Daily",
};

function readJson(): Record<string, unknown> | null {
  if (!fs.existsSync(CITY_CONFIG_PATH)) return null;
  const raw = fs.readFileSync(CITY_CONFIG_PATH, "utf8").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

/** Never throws — a missing/malformed city-config.json falls back to generic placeholder text rather than breaking a caller. */
export function getCityConfigSummary(): CityConfigSummary {
  const config = readJson();
  if (!config) return SUMMARY_FALLBACK;

  const cityIdentity = (config.cityIdentity ?? {}) as Record<string, unknown>;
  const cityName = (cityIdentity.cityName ?? {}) as Record<string, unknown>;
  const editorial = (config.editorial ?? {}) as Record<string, unknown>;
  const newsletterName = (editorial.newsletterName ?? {}) as Record<string, unknown>;

  return {
    cityNameNe: str(cityName.ne, SUMMARY_FALLBACK.cityNameNe),
    cityNameEn: str(cityName.en, SUMMARY_FALLBACK.cityNameEn),
    newsletterNameNe: str(newsletterName.ne, SUMMARY_FALLBACK.newsletterNameNe),
    newsletterNameEn: str(newsletterName.en, SUMMARY_FALLBACK.newsletterNameEn),
  };
}

/**
 * Flat list of locality terms (mixed language, matched case-insensitively
 * by callers) used to boost topically-relevant images that are also
 * genuinely local to the active city — see src/lib/library/match.ts.
 * Sourced from city-config.json's cityIdentity.localityTerms.
 *
 * Falls back to an empty array — never to any specific city's terms — if
 * city-config.json is missing or doesn't define localityTerms. An empty
 * list simply means the locality bonus never fires (WEIGHTS.locality is
 * moot), which is always safe: it can only make matching more
 * conservative, never cause a wrong-city term to leak in.
 */
export function getLocalityTerms(): string[] {
  const config = readJson();
  if (!config) return [];
  const cityIdentity = (config.cityIdentity ?? {}) as Record<string, unknown>;
  const terms = cityIdentity.localityTerms;
  if (!Array.isArray(terms)) return [];
  return terms.filter((t): t is string => typeof t === "string");
}

/** Newsletter name for the active city — used by scripts/build-newsletter.ts's script mirror; see that file's own duplicate reader and its header comment for why it can't import this module directly. */
export function getNewsletterName(): { ne: string; en: string } {
  const summary = getCityConfigSummary();
  return { ne: summary.newsletterNameNe, en: summary.newsletterNameEn };
}
