import type { Metadata } from "next";
import { searchArticles } from "@/lib/content/articles";
import ArticleCard from "@/components/ArticleCard";

export const metadata: Metadata = {
  title: "खोज्नुहोस्",
  description: "मेचीनगर लोकलका समाचारहरू खोज्नुहोस्।",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? searchArticles(query) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="h-display">खोज्नुहोस्</h1>

      <form action="/search" method="get" className="mt-6 flex gap-3">
        <label htmlFor="search-q" className="sr-only">
          खोज शब्द
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="जस्तै: काकरभिट्टा, सडक, बजार..."
          className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          खोज्नुहोस्
        </button>
      </form>

      <div className="mt-8">
        {!query && <p className="summary-text">खोज्न माथिको बाकसमा शब्द लेख्नुहोस्।</p>}

        {query && results.length === 0 && (
          <p className="summary-text">
            &ldquo;{query}&rdquo; का लागि कुनै समाचार भेटिएन। अर्को शब्दले खोजी गर्नुहोस्।
          </p>
        )}

        {query && results.length > 0 && (
          <>
            <p className="meta-text mb-2">
              &ldquo;{query}&rdquo; का लागि {results.length} नतिजा भेटियो
            </p>
            {results.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
