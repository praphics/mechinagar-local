"use client";

import { useMemo, useState } from "react";
import type { LibraryCategory, LibraryImageRecord, LibraryReviewStatus } from "@/lib/library/types";
import { deriveReviewStatus } from "@/lib/library/types";
import { getCategoryBySlug } from "@/lib/data/categories";
import ImageReviewCard from "@/components/review/ImageReviewCard";

type StatusFilter = "all" | LibraryReviewStatus;
type CategoryFilter = "all" | LibraryCategory;

function categoryLabel(slug: LibraryCategory): string {
  const siteCategory = getCategoryBySlug(slug);
  if (siteCategory) return siteCategory.nameNe;
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export default function ImageReviewDashboard({
  images,
  categories,
}: {
  images: LibraryImageRecord[];
  categories: readonly LibraryCategory[];
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const counts = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    for (const image of images) {
      const status = deriveReviewStatus(image);
      if (status === "approved") approved++;
      else if (status === "rejected") rejected++;
      else pending++;
    }
    return { total: images.length, approved, pending, rejected };
  }, [images]);

  const filtered = useMemo(() => {
    return images.filter((image) => {
      if (categoryFilter !== "all" && image.category !== categoryFilter) return false;
      if (statusFilter !== "all" && deriveReviewStatus(image) !== statusFilter) return false;
      return true;
    });
  }, [images, statusFilter, categoryFilter]);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="meta-text">जम्मा: {counts.total}</span>
        <span className="font-semibold text-brand">स्वीकृत: {counts.approved}</span>
        <span className="meta-text">समीक्षा बाँकी: {counts.pending}</span>
        <span className="font-semibold text-ink-faint">अस्वीकृत: {counts.rejected}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="meta-text">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <span className="meta-text">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink"
          >
            <option value="all">All</option>
            {categories.map((slug) => (
              <option key={slug} value={slug}>
                {categoryLabel(slug)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="summary-text mt-8">यो फिल्टरसँग मिल्ने कुनै तस्बिर छैन।</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((image) => (
            <ImageReviewCard key={`${image.category}/${image.filename}`} image={image} />
          ))}
        </div>
      )}
    </div>
  );
}
