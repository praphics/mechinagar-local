import type { Alert } from "@/lib/types";
import { formatNepaliDateTime } from "@/lib/datetime";

/**
 * Renders nothing at all when there is no genuine, verified alert — never a
 * collapsed/greyed-out placeholder (see HOMEPAGE_SPEC.md §2.1).
 */
export default function AlertBanner({ alert }: { alert: Alert | null }) {
  if (!alert) return null;

  return (
    <div className="flex gap-3 rounded-md border border-notice/30 bg-notice-tint px-4 py-3">
      <span className="text-notice shrink-0 mt-0.5" aria-hidden="true">
        <WarningIcon />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-notice uppercase">
          जरुरी सूचना
        </p>
        <p className="text-sm font-semibold text-ink mt-0.5">{alert.headline}</p>
        <p className="summary-text mt-1">{alert.body}</p>
        <p className="meta-text mt-1">
          स्रोत: {alert.sourceName} · {formatNepaliDateTime(alert.issuedAt)}
        </p>
      </div>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinejoin="round" />
      <path d="M12 9v4" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}
