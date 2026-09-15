import { notFound } from "next/navigation";
import { getLibraryManifest } from "@/lib/library/manifest";
import { LIBRARY_CATEGORIES } from "@/lib/library/types";
import ImageReviewDashboard from "@/components/review/ImageReviewDashboard";

/**
 * Internal editorial tool — not part of the public site. Disabled entirely
 * once NODE_ENV=production (mirrors DevModeBanner's gate), so it never
 * ships as a reachable route, and its Server Actions independently refuse
 * to run in production too (see reviewActions.ts) as a second guard.
 */
export default function ImageReviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const images = getLibraryManifest();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="h-display">तस्बिर पुस्तकालय समीक्षा</h1>
      <p className="summary-text mt-2">
        आन्तरिक सम्पादकीय उपकरण — यो पृष्ठ स्थानीय विकास वातावरणमा मात्र उपलब्ध छ।
      </p>

      <ImageReviewDashboard images={images} categories={LIBRARY_CATEGORIES} />
    </div>
  );
}
