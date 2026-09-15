import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, getCategoryBySlug } from "@/lib/data/categories";
import { getArticlesByCategory } from "@/lib/content/articles";
import { siteConfig } from "@/lib/site-config";
import ArticleCard from "@/components/ArticleCard";

export const revalidate = 300;

const PAGE_SIZE = 6;

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.nameNe,
    description: category.descriptionNe ?? `${category.nameNe} — ${siteConfig.name} का समाचारहरू।`,
    alternates: { canonical: `${siteConfig.url}/category/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const allArticles = getArticlesByCategory(category.slug);
  const page = Math.max(1, Number(pageParam) || 1);
  const visibleArticles = allArticles.slice(0, page * PAGE_SIZE);
  const hasMore = visibleArticles.length < allArticles.length;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="h-display">{category.nameNe}</h1>
      {category.descriptionNe && <p className="summary-text mt-2">{category.descriptionNe}</p>}

      <div className="mt-8">
        {visibleArticles.length > 0 ? (
          visibleArticles.map((article) => <ArticleCard key={article.slug} article={article} />)
        ) : (
          <p className="summary-text py-8">
            यस श्रेणीमा अहिलेसम्म कुनै समाचार प्रकाशित भएको छैन। पछि फेरि जाँच्नुहोस्।
          </p>
        )}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <Link
            href={`/category/${category.slug}?page=${page + 1}`}
            className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            थप हेर्नुहोस्
          </Link>
        </div>
      )}
    </div>
  );
}
