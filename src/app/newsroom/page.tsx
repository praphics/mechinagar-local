import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import { getAllArticlesIncludingDrafts, getLatestArticles } from "@/lib/content/articles";
import { getCityConfigSummary } from "@/lib/cityConfig";
import { getNewsroomQueue } from "@/lib/newsroom/queue";
import { getWorkflowCounts, getAttentionQueue, getEditorialReadiness, type EditorialReadiness } from "@/lib/newsroom/overview";
import { getLatestNewsletterReview } from "@/lib/newsroom/newsletterReview";
import { getBeehiivReview } from "@/lib/newsroom/beehiivReview";
import { formatNepaliDateLong, getNepalNow } from "@/lib/datetime";

const WORKFLOW_LABEL: Record<string, string> = {
  DISCOVERED: "Discovered",
  FACT_CHECKED: "Fact-checked",
  DRAFT_READY: "Draft ready",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  BLOCKED: "Blocked",
};

const WORKFLOW_STYLE: Record<string, string> = {
  DISCOVERED: "bg-line text-ink-faint",
  FACT_CHECKED: "bg-line text-ink-faint",
  DRAFT_READY: "bg-notice-tint text-notice",
  APPROVED: "bg-brand-tint text-brand-dark",
  PUBLISHED: "bg-brand text-white",
  REJECTED: "bg-line text-ink-faint",
  BLOCKED: "bg-notice-tint text-notice",
};

const READINESS_LABEL: Record<EditorialReadiness, string> = {
  "NOT READY": "Not ready",
  "READY FOR EDITORIAL REVIEW": "Ready for editorial review",
  "READY FOR BEEHIIV DRAFT": "Ready for Beehiiv draft",
  "BEEHIIV DRAFT VERIFIED": "Beehiiv draft verified",
};

const READINESS_STYLE: Record<EditorialReadiness, string> = {
  "NOT READY": "bg-line text-ink-faint",
  "READY FOR EDITORIAL REVIEW": "bg-notice-tint text-notice",
  "READY FOR BEEHIIV DRAFT": "bg-brand-tint text-brand-dark",
  "BEEHIIV DRAFT VERIFIED": "bg-brand text-white",
};

const BEEHIIV_STATE_STYLE: Record<string, string> = {
  "NOT CREATED": "bg-line text-ink-faint",
  "DRAFT CREATED": "bg-notice-tint text-notice",
  VERIFIED: "bg-brand text-white",
  ERROR: "bg-notice-tint text-notice",
};

/**
 * Internal editorial dashboard — read-only, observability only. Disabled
 * entirely once NODE_ENV=production, same gate as
 * src/app/review/images/page.tsx, so it's never a reachable public route
 * and never exposes evidence/workflow data outside local development.
 *
 * This page performs NO mutation of any kind: no article write, no
 * manifest write, no newsroom-state write. Approve/Reject/Publish remain
 * exclusively a scripts/newsroom-action.ts CLI action — this page only
 * shows the exact command an editor would run.
 */
export default function NewsroomDashboardPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const city = getCityConfigSummary();
  const allArticles = getAllArticlesIncludingDrafts();
  const publishedCount = allArticles.filter((a) => a.status === "published").length;
  const draftCount = allArticles.filter((a) => a.status === "draft").length;
  const { report, items } = getNewsroomQueue();
  const recentlyPublished = getLatestArticles(5);

  const workflowCounts = getWorkflowCounts();
  const attentionQueue = getAttentionQueue();
  const newsletter = getLatestNewsletterReview();
  const beehiiv = newsletter ? getBeehiivReview(newsletter.date) : null;
  const readiness = getEditorialReadiness(newsletter, attentionQueue, beehiiv);
  const newsletterPreviewHtml = newsletter ? (marked.parse(newsletter.contentPreview, { async: false }) as string) : "";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
      <p className="summary-text mb-2">
        आन्तरिक सम्पादकीय ड्यासबोर्ड — यो पृष्ठ स्थानीय विकास वातावरणमा मात्र उपलब्ध छ। हेर्दैमा कुनै लेख वा फाइल परिवर्तन हुँदैन।
      </p>

      {/* HEADER */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-6 pb-6 border-b border-line">
        <div>
          <h1 className="h-display">{city.cityNameNe} — Newsroom Dashboard</h1>
          <p className="meta-text mt-1">
            {city.cityNameEn} · {city.newsletterNameEn}
          </p>
        </div>
        <p className="text-base font-semibold text-ink">{formatNepaliDateLong(getNepalNow())}</p>
      </div>

      {/* EDITORIAL READINESS */}
      <div className="flex flex-wrap items-center gap-3 mb-10">
        <span className="eyebrow">Editorial readiness:</span>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${READINESS_STYLE[readiness]}`}>
          {READINESS_LABEL[readiness]}
        </span>
        <span className="meta-text">This system never sends anything automatically — there is no &ldquo;ready to send&rdquo; state.</span>
      </div>

      <div className="flex flex-wrap gap-6 mb-10">
        <div className="rounded-sm border border-line bg-surface px-5 py-3">
          <p className="eyebrow">Published</p>
          <p className="text-2xl font-semibold text-brand">{publishedCount}</p>
        </div>
        <div className="rounded-sm border border-line bg-surface px-5 py-3">
          <p className="eyebrow">Draft</p>
          <p className="text-2xl font-semibold text-ink">{draftCount}</p>
        </div>
        <div className="rounded-sm border border-line bg-surface px-5 py-3">
          <p className="eyebrow">Total articles</p>
          <p className="text-2xl font-semibold text-ink">{allArticles.length}</p>
        </div>
      </div>

      {/* ATTENTION QUEUE */}
      <section className="mb-12">
        <h2 className="h-section mb-3">आजको ध्यान दिनुपर्ने सूची (Attention queue)</h2>
        {attentionQueue.length === 0 ? (
          <p className="summary-text">Nothing needs attention right now — no open evidence, fact-check, image, approval, newsletter, or Beehiiv issues.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line border border-line rounded-sm">
            {attentionQueue.map((item, i) => (
              <li key={i} className="p-3 sm:p-4 flex items-start gap-3">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    item.severity === "warning" ? "bg-notice-tint text-notice" : "bg-line text-ink-faint"
                  }`}
                >
                  {item.severity === "warning" ? "⚠ Warning" : "Info"}
                </span>
                {item.href ? (
                  <Link href={item.href} className="summary-text hover:underline">
                    {item.message}
                  </Link>
                ) : (
                  <span className="summary-text">{item.message}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* WORKFLOW STATE BREAKDOWN */}
      <section className="mb-12">
        <h2 className="h-section mb-3">Workflow state breakdown</h2>
        <p className="meta-text mb-3">
          {workflowCounts.totalArticles} article(s) total — {workflowCounts.notTracked} predate newsroom workflow tracking and have no workflow record (this is expected, not an error).
        </p>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(workflowCounts.byState) as (keyof typeof workflowCounts.byState)[]).map((state) => (
            <div key={state} className="rounded-sm border border-line bg-surface px-4 py-2">
              <p className={`text-xs font-semibold rounded-full px-2 py-0.5 inline-block mb-1 ${WORKFLOW_STYLE[state]}`}>
                {WORKFLOW_LABEL[state]}
              </p>
              <p className="text-xl font-semibold text-ink">{workflowCounts.byState[state]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TODAY'S NEWSROOM QUEUE */}
      <section className="mb-12">
        <h2 className="h-section mb-1">आजको न्यूजरूम क्यू</h2>
        {report ? (
          <p className="meta-text mb-4">
            Report {report.reportId} — {report.date} ({items.length} item{items.length === 1 ? "" : "s"})
          </p>
        ) : (
          <p className="meta-text mb-4">No report has been recorded yet. Run /local-news to generate one.</p>
        )}

        {items.length === 0 ? (
          <p className="summary-text">No stories currently tracked in the newsroom queue.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex flex-col divide-y divide-line border border-line rounded-sm">
              {items.map((item) => (
                <article key={item.slug} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="eyebrow">
                        #{item.position} · {item.category ?? "—"} {item.source ? `· ${item.source}` : ""}
                      </p>
                      <h3 className="h-card-compact mt-1">
                        <Link href={`/newsroom/${item.slug}`} className="hover:underline">
                          {item.title}
                        </Link>
                      </h3>
                      <p className="meta-text mt-1 break-all">{item.slug}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${WORKFLOW_STYLE[item.workflowState] ?? "bg-line text-ink-faint"}`}
                    >
                      {WORKFLOW_LABEL[item.workflowState] ?? item.workflowState}
                    </span>
                  </div>

                  <dl className="meta-text mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                    <dt className="font-semibold">Article status:</dt>
                    <dd>{item.articleStatus}</dd>

                    <dt className="font-semibold">Fact-check:</dt>
                    <dd>{item.factCheckPassed ? "Passed" : "Not passed"} — {item.factCheckSummary}</dd>

                    <dt className="font-semibold">Evidence:</dt>
                    <dd>
                      {item.evidence.symbol} {item.evidence.label}
                    </dd>

                    <dt className="font-semibold">Image decision:</dt>
                    <dd>{item.imageDecision}</dd>

                    <dt className="font-semibold">Approval:</dt>
                    <dd>{item.approvalLabel}</dd>
                  </dl>

                  <div className="mt-3 pt-3 border-t border-line/70 text-xs text-ink-faint font-mono">
                    <p>Approve: node --experimental-strip-types scripts/newsroom-action.ts approve {item.position}</p>
                    <p>Reject:&nbsp;&nbsp;node --experimental-strip-types scripts/newsroom-action.ts reject {item.position}</p>
                    <p>Publish: node --experimental-strip-types scripts/newsroom-action.ts publish {item.position}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* RECENTLY PUBLISHED */}
      <section className="mb-12">
        <h2 className="h-section mb-3">हालसालै प्रकाशित</h2>
        {recentlyPublished.length === 0 ? (
          <p className="summary-text">No published articles yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {recentlyPublished.map((article) => (
              <li key={article.slug} className="py-3 flex items-baseline justify-between gap-4">
                <Link href={`/newsroom/${article.slug}`} className="h-card-compact hover:underline min-w-0 truncate">
                  {article.headline}
                </Link>
                <span className="meta-text shrink-0">{article.publishedAt.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* NEWSLETTER REVIEW */}
      <section className="mb-12">
        <h2 className="h-section mb-1">Newsletter review</h2>
        {!newsletter ? (
          <p className="summary-text">No newsletter has been generated yet. Run `npm run newsletter:today` to build one.</p>
        ) : (
          <div className="border border-line rounded-sm p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-notice-tint text-notice">REVIEW ONLY</span>
              <span className="meta-text">
                {newsletter.date} · generation status: {newsletter.generationStatus} · {newsletter.generatedFile}
              </span>
            </div>

            <dl className="meta-text mb-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
              <dt className="font-semibold">City:</dt>
              <dd>{city.cityNameEn} ({city.cityNameNe})</dd>
              <dt className="font-semibold">Newsletter name:</dt>
              <dd>{city.newsletterNameEn} ({city.newsletterNameNe})</dd>
              <dt className="font-semibold">Generated at:</dt>
              <dd>{newsletter.generatedAt ?? "(not recorded)"}</dd>
              <dt className="font-semibold">Integrity:</dt>
              <dd>{newsletter.sourcesSummary} · {newsletter.excludedSummary}</dd>
            </dl>

            {newsletter.potentialIssues.length > 0 && (
              <div className="mb-4 rounded-sm bg-notice-tint px-3 py-2">
                <p className="text-xs font-semibold text-notice mb-1">Potential issues:</p>
                <ul className="text-xs text-notice list-disc pl-4">
                  {newsletter.potentialIssues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-4">
              <p className="eyebrow mb-2">Selected stories ({newsletter.selectedStories.length})</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs meta-text border-collapse">
                  <thead>
                    <tr className="text-left border-b border-line">
                      <th className="py-1.5 pr-3 font-semibold">Title</th>
                      <th className="py-1.5 pr-3 font-semibold">Status</th>
                      <th className="py-1.5 pr-3 font-semibold">Source</th>
                      <th className="py-1.5 pr-3 font-semibold">Fact-check</th>
                      <th className="py-1.5 pr-3 font-semibold">Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newsletter.selectedStories.map((s) => (
                      <tr key={s.slug} className="border-b border-line/60">
                        <td className="py-1.5 pr-3">
                          <Link href={`/newsroom/${s.slug}`} className="hover:underline">{s.title}</Link>
                        </td>
                        <td className="py-1.5 pr-3">{s.status}</td>
                        <td className="py-1.5 pr-3">{s.source ?? "—"}</td>
                        <td className="py-1.5 pr-3">{s.factCheckStatus}</td>
                        <td className="py-1.5 pr-3">{s.evidenceStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {newsletter.omittedStories.length > 0 && (
              <div className="mb-4">
                <p className="eyebrow mb-2">Omitted stories ({newsletter.omittedStories.length}) — published this date but beyond the newsletter&apos;s story cap</p>
                <ul className="text-xs meta-text list-disc pl-4">
                  {newsletter.omittedStories.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/newsroom/${s.slug}`} className="hover:underline">{s.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="eyebrow mb-2">Content preview (as generated — REVIEW ONLY, not sent)</p>
              <div
                className="article-body text-sm border-t border-line pt-4"
                dangerouslySetInnerHTML={{ __html: newsletterPreviewHtml }}
              />
            </div>
          </div>
        )}
      </section>

      {/* BEEHIIV DRAFT */}
      <section>
        <h2 className="h-section mb-3">Beehiiv draft</h2>
        {!newsletter || !beehiiv ? (
          <p className="summary-text">No newsletter exists yet, so no Beehiiv draft can exist either.</p>
        ) : (
          <div className="border border-line rounded-sm p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BEEHIIV_STATE_STYLE[beehiiv.state]}`}>
                {beehiiv.state}
              </span>
              <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-line text-ink-faint">NOT SENT</span>
            </div>
            <dl className="meta-text grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
              <dt className="font-semibold">Draft ID:</dt>
              <dd className="break-all">{beehiiv.draftId ?? "(none — no draft created yet)"}</dd>
              <dt className="font-semibold">Created at:</dt>
              <dd>{beehiiv.createdAt ?? "—"}</dd>
              <dt className="font-semibold">Last verified status:</dt>
              <dd>{beehiiv.verifiedStatus ?? "(not yet verified)"}</dd>
              <dt className="font-semibold">Last verified at:</dt>
              <dd>{beehiiv.verifiedAt ?? "—"}</dd>
              <dt className="font-semibold">Preview:</dt>
              <dd>
                {beehiiv.previewUrl ? (
                  <a href={beehiiv.previewUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline break-all">
                    {beehiiv.previewUrl}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </dl>
            <p className="meta-text mt-4 text-xs">
              This dashboard never calls Beehiiv directly and never holds BEEHIIV_API_KEY — it only displays what{" "}
              <span className="font-mono">scripts/newsletter-beehiiv-draft.ts</span> last verified and cached locally.
              Creating or refreshing a draft is a separate, explicit CLI action:{" "}
              <span className="font-mono">npm run newsletter:draft -- {newsletter.date}</span>.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
