"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { LibraryImageRecord } from "@/lib/library/types";
import { deriveReviewStatus } from "@/lib/library/types";
import { approveImage, rejectImage, resetImageToPending } from "@/lib/library/reviewActions";

const STATUS_LABEL: Record<string, string> = {
  approved: "APPROVED",
  pending: "PENDING REVIEW",
  rejected: "REJECTED",
};

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-brand text-white",
  pending: "bg-notice-tint text-notice",
  rejected: "bg-line text-ink-faint",
};

export default function ImageReviewCard({ image }: { image: LibraryImageRecord }) {
  const status = deriveReviewStatus(image);
  const [confirming, setConfirming] = useState<"approve" | "reject" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const src = `/images/library/${image.category}/${image.filename}`;

  function runAction(action: () => Promise<{ ok: true; filename: string; approved: boolean }>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        setConfirming(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "असफल भयो");
      }
    });
  }

  return (
    <article className="flex flex-col rounded-sm border border-line bg-surface overflow-hidden">
      <div className="relative w-full aspect-[16/10] shrink-0 bg-paper">
        <Image
          src={src}
          alt={image.description || image.filename}
          fill
          unoptimized
          className="object-cover"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        <span
          className={`absolute top-2 left-2 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${STATUS_STYLE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-2 p-4">
        <div>
          <p className="eyebrow">{image.category}</p>
          <p className="h-card-compact mt-0.5 break-all">{image.filename}</p>
        </div>

        {image.description && <p className="summary-text">{image.description}</p>}

        {image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {image.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-paper border border-line px-2 py-0.5 text-xs text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <dl className="meta-text mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
          <dt className="font-semibold">Source:</dt>
          <dd>{image.source}</dd>
          <dt className="font-semibold">Author:</dt>
          <dd>{image.author || "—"}</dd>
          <dt className="font-semibold">License:</dt>
          <dd>{image.license}</dd>
          <dt className="font-semibold">Credit:</dt>
          <dd>{image.creditText || (image.creditRequired ? "(required, not set)" : "—")}</dd>
          <dt className="font-semibold">Type:</dt>
          <dd>
            {image.type} / {image.usage}
          </dd>
          <dt className="font-semibold">Source URL:</dt>
          <dd>
            <a
              href={image.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline break-all"
            >
              {image.sourceUrl}
            </a>
          </dd>
        </dl>

        {error && <p className="text-sm text-notice">{error}</p>}

        <div className="mt-auto pt-3 border-t border-line">
          {confirming === "approve" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-ink">Approve this image for article use?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => runAction(() => approveImage(image.category, image.filename))}
                  className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {isPending ? "..." : "Yes, approve"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {confirming === "reject" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-ink">Reject this image?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => runAction(() => rejectImage(image.category, image.filename))}
                  className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-50"
                >
                  {isPending ? "..." : "Yes, reject"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {confirming === null && status === "pending" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming("approve")}
                className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setConfirming("reject")}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
              >
                Reject
              </button>
            </div>
          )}

          {confirming === null && status === "rejected" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => runAction(() => resetImageToPending(image.category, image.filename))}
              className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
            >
              {isPending ? "..." : "Reconsider (move back to pending)"}
            </button>
          )}

          {confirming === null && status === "approved" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => runAction(() => resetImageToPending(image.category, image.filename))}
              className="text-xs font-medium text-ink-muted hover:underline disabled:opacity-50"
            >
              {isPending ? "..." : "Move back to pending"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
