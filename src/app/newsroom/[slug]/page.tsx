import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAllArticlesIncludingDrafts } from "@/lib/content/articles";
import { getStoryBySlug } from "@/lib/newsroom/state";
import { evidenceStatusFor } from "@/lib/newsroom/queue";
import { describeImageProvenance } from "@/lib/newsroom/imageProvenance";

/**
 * Internal editorial dashboard — read-only article inspection. Same
 * non-production gate as /newsroom itself and src/app/review/images —
 * never a reachable public route. This page never writes to the article
 * file, newsroom state, or anything else; it only reads and displays.
 */
export default async function NewsroomArticleInspectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { slug } = await params;
  const article = getAllArticlesIncludingDrafts().find((a) => a.slug === slug);
  const story = getStoryBySlug(slug);

  if (!article && !story) {
    notFound();
  }

  const imageProvenance = article ? describeImageProvenance(article.featuredImage) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <Link href="/newsroom" className="meta-text hover:underline">
        ← Newsroom dashboard
      </Link>

      <p className="summary-text mt-4 mb-6">
        Read-only inspection — viewing this page does not modify the article or the newsroom state.
      </p>

      {article ? (
        <>
          <p className="eyebrow">{article.categorySlug}</p>
          <h1 className="h-display mt-1">{article.headline}</h1>
          <p className="summary-text mt-3">{article.summary}</p>

          <dl className="meta-text mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            <dt className="font-semibold">Slug:</dt>
            <dd className="break-all">{article.slug}</dd>
            <dt className="font-semibold">Article status:</dt>
            <dd>{article.status}</dd>
            <dt className="font-semibold">Source:</dt>
            <dd>{article.source ?? "—"}</dd>
            <dt className="font-semibold">Source URL:</dt>
            <dd className="break-all">
              {article.sourceUrl ? (
                <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                  {article.sourceUrl}
                </a>
              ) : (
                "—"
              )}
            </dd>
            <dt className="font-semibold">Published at:</dt>
            <dd>{article.publishedAt}</dd>
          </dl>

          <div
            className="article-body mt-8 pt-6 border-t border-line"
            dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
          />

          {article.featuredImage && imageProvenance && (
            <div className="mt-10 pt-6 border-t border-line">
              <h2 className="h-section mb-3">Image</h2>
              <div className="relative w-full max-w-md aspect-video mb-3 rounded-sm overflow-hidden border border-line bg-surface">
                <Image src={article.featuredImage.src} alt={article.featuredImage.alt} fill className="object-cover" unoptimized />
              </div>
              <dl className="meta-text grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                <dt className="font-semibold">Src:</dt>
                <dd className="break-all font-mono text-xs">{article.featuredImage.src}</dd>
                <dt className="font-semibold">Type:</dt>
                <dd>{imageProvenance.type}</dd>
                <dt className="font-semibold">Usage:</dt>
                <dd>{imageProvenance.usage}</dd>
                <dt className="font-semibold">Disclosure required:</dt>
                <dd>{imageProvenance.disclosureRequired ? "YES — not a documentary photo of this specific event" : "No — verified documentary usage"}</dd>
                <dt className="font-semibold">Provenance:</dt>
                <dd>{imageProvenance.provenance}</dd>
              </dl>
            </div>
          )}
        </>
      ) : (
        <p className="summary-text mb-6">
          No article file exists yet for <span className="font-mono">{slug}</span> — it has a newsroom
          workflow record but hasn&apos;t been drafted to disk.
        </p>
      )}

      {story && (
        <div className="mt-10 pt-6 border-t border-line">
          <h2 className="h-section mb-3">Newsroom workflow</h2>
          <dl className="meta-text grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            <dt className="font-semibold">Workflow state:</dt>
            <dd>{story.workflowState}</dd>
            <dt className="font-semibold">Fact-check:</dt>
            <dd>{story.factCheckPassed ? "Passed" : "Not passed"} — {story.factCheckSummary || "(not recorded)"}</dd>
            <dt className="font-semibold">Evidence:</dt>
            <dd>
              {evidenceStatusFor(story.evidenceRequired).symbol} {evidenceStatusFor(story.evidenceRequired).label}
            </dd>
            <dt className="font-semibold">Image decision:</dt>
            <dd>{story.imageDecision || "unresolved"}</dd>
            <dt className="font-semibold">Approved at:</dt>
            <dd>{story.approvedAt ?? "(not approved)"}</dd>
            <dt className="font-semibold">Published at:</dt>
            <dd>{story.publishedAt ?? "(not published)"}</dd>
            {story.rejectedAt && (
              <>
                <dt className="font-semibold">Rejected at:</dt>
                <dd>{story.rejectedAt} — {story.rejectionReason}</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
