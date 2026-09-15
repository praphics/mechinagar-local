/**
 * Sitewide disclosure that visible content is sample/development data, not
 * verified reporting (see CONTENT_STRATEGY.md §5 on sourcing standards).
 * Auto-disabled on `next build`/`next start` (NODE_ENV=production) so it
 * never ships to a real production deploy — no manual removal needed once
 * the site is publishing genuine, sourced articles. `next dev` always shows it.
 */
export default function DevModeBanner() {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="bg-[#efe7dc] text-ink-muted border-b border-line">
      <p className="mx-auto max-w-6xl px-4 sm:px-6 py-1.5 text-xs text-center">
        विकास संस्करण — देखिने समाचारहरू नमूना सामग्री हुन्, वास्तविक प्रकाशित समाचार होइनन्।
      </p>
    </div>
  );
}
