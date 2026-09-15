import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAllPublishedArticles, getArticleBySlug, getRelatedArticles } from "@/lib/content/articles";
import { getCategoryBySlug } from "@/lib/data/categories";
import { formatNepaliDateTime } from "@/lib/datetime";
import { siteConfig } from "@/lib/site-config";
import CategoryTag from "@/components/CategoryTag";
import ShareButtons from "@/components/ShareButtons";
import NewsletterSignup from "@/components/NewsletterSignup";

export const revalidate = 300;

export function generateStaticParams() {
  return getAllPublishedArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  const url = `${siteConfig.url}/article/${article.slug}`;

  return {
    title: article.headline,
    description: article.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.headline,
      description: article.summary,
      url,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt ?? article.publishedAt,
      images: article.featuredImage ? [{ url: article.featuredImage.src }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.headline,
      description: article.summary,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const category = getCategoryBySlug(article.categorySlug);
  const related = getRelatedArticles(article);
  const url = `${siteConfig.url}/article/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.headline,
    description: article.summary,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    inLanguage: article.language,
    author: { "@type": "Organization", name: article.author },
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    image: article.featuredImage ? [`${siteConfig.url}${article.featuredImage.src}`] : undefined,
    mainEntityOfPage: url,
  };

  return (
    <article lang={article.language} className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <CategoryTag categorySlug={article.categorySlug} />
      <h1 className="h-display mt-2">{article.headline}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 meta-text">
        <span>{article.author}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={article.publishedAt}>{formatNepaliDateTime(article.publishedAt)}</time>
        {article.updatedAt && (
          <>
            <span aria-hidden="true">·</span>
            <span>अद्यावधिक: {formatNepaliDateTime(article.updatedAt)}</span>
          </>
        )}
      </div>

      <div className="mt-4">
        <ShareButtons url={url} title={article.headline} />
      </div>

      {article.featuredImage && (
        <figure className="mt-6">
          <div className="relative w-full aspect-[3/2] overflow-hidden rounded-sm bg-surface">
            <Image
              src={article.featuredImage.src}
              alt={article.featuredImage.alt}
              fill
              unoptimized
              priority
              className="object-cover"
              sizes="(min-width: 768px) 768px, 100vw"
            />
          </div>
          {article.featuredImage.caption && (
            <figcaption className="meta-text mt-2">{article.featuredImage.caption}</figcaption>
          )}
        </figure>
      )}

      {/* bodyHtml is rendered from content/articles/*.md — trusted, git-committed
          editor content, not runtime user input. */}
      <div
        className="article-body mt-6"
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />

      {(article.source || article.attachment) && (
        <div className="mt-8 flex flex-col gap-2">
          {article.source && (
            <div className="rounded-sm border border-line bg-surface px-4 py-3 meta-text">
              स्रोत:{" "}
              {article.sourceUrl ? (
                <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                  {article.source}
                </a>
              ) : (
                article.source
              )}
            </div>
          )}
          {article.attachment && (
            <div className="rounded-sm border border-line bg-surface px-4 py-3 meta-text">
              <a
                href={article.attachment.src}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand hover:underline"
              >
                {article.attachment.label}
              </a>
            </div>
          )}
        </div>
      )}

      <div className="mt-10">
        <NewsletterSignup compact />
      </div>

      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="h-section mb-3">सम्बन्धित समाचार</h2>
          <ul className="flex flex-col divide-y divide-line">
            {related.map((r) => (
              <li key={r.slug} className="py-3">
                <Link href={`/article/${r.slug}`} className="h-card-compact hover:underline block">
                  {r.headline}
                </Link>
                <span className="meta-text">{formatNepaliDateTime(r.publishedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {category && (
        <div className="mt-8">
          <Link href={`/category/${category.slug}`} className="text-sm font-semibold text-brand hover:underline">
            {category.nameNe} का थप समाचार हेर्नुहोस् →
          </Link>
        </div>
      )}
    </article>
  );
}
