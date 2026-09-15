import Link from "next/link";
import Image from "next/image";
import { getFeaturedArticles, getLatestArticles } from "@/lib/content/articles";
import { currentAlert } from "@/lib/data/alert";
import { getNepalNow, formatNepaliDateLong, formatNepaliDateTime, formatNepaliRelative } from "@/lib/datetime";
import CategoryTag from "@/components/CategoryTag";
import AlertBanner from "@/components/AlertBanner";

export default function TodaysMechinagar() {
  const today = getNepalNow();
  const [leadStory, ...secondaryStories] = getFeaturedArticles(4);
  const latestUpdates = getLatestArticles(5);
  const mostRecent = latestUpdates[0];

  return (
    <section className="border-y border-line bg-brand-tint/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        {/* Header row: heading + date, kept compact to avoid empty vertical space */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-6">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h1 className="h-display text-brand">आज मेचीनगरमा</h1>
            <span className="meta-text">Today&apos;s Mechinagar</span>
          </div>
          <p className="text-base font-semibold text-ink">{formatNepaliDateLong(today)}</p>
        </div>

        {currentAlert && (
          <div className="mb-6">
            <AlertBanner alert={currentAlert} />
          </div>
        )}

        {leadStory && (
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
            {/* Visual lead story — the day's top story, image-led */}
            <div className="lg:col-span-2 flex flex-col sm:flex-row gap-5">
              {leadStory.featuredImage && (
                <Link
                  href={`/article/${leadStory.slug}`}
                  className="relative block w-full sm:w-1/2 aspect-[16/10] shrink-0 overflow-hidden rounded-sm"
                >
                  <Image
                    src={leadStory.featuredImage.src}
                    alt={leadStory.featuredImage.alt}
                    fill
                    unoptimized
                    priority
                    className="object-cover"
                    sizes="(min-width: 1024px) 500px, (min-width: 640px) 50vw, 100vw"
                  />
                </Link>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <CategoryTag categorySlug={leadStory.categorySlug} />
                <h2 className="h-headline mt-2">
                  <Link href={`/article/${leadStory.slug}`} className="hover:underline">
                    {leadStory.headline}
                  </Link>
                </h2>
                <p className="summary-text mt-2.5 line-clamp-3">{leadStory.summary}</p>
                <time dateTime={leadStory.publishedAt} className="meta-text mt-3 block">
                  {formatNepaliRelative(leadStory.publishedAt)}
                </time>
              </div>
            </div>

            {/* Sidebar: rest of today's important stories + a headline-only teaser */}
            <div className="lg:col-span-1 flex flex-col gap-7">
              {secondaryStories.length > 0 && (
                <div>
                  <h3 className="eyebrow mb-2">थप महत्त्वपूर्ण समाचार</h3>
                  <ul className="flex flex-col divide-y divide-line">
                    {secondaryStories.map((article) => (
                      <li key={article.slug} className="py-3.5 first:pt-0">
                        <CategoryTag categorySlug={article.categorySlug} />
                        <h4 className="h-card-compact mt-1">
                          <Link href={`/article/${article.slug}`} className="hover:underline">
                            {article.headline}
                          </Link>
                        </h4>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestUpdates.length > 0 && (
                <div>
                  <h3 className="eyebrow mb-2">पछिल्ला अपडेटहरू</h3>
                  <ul className="flex flex-col divide-y divide-line">
                    {latestUpdates.map((article) => (
                      <li key={article.slug} className="py-3 flex items-baseline justify-between gap-4">
                        <Link
                          href={`/article/${article.slug}`}
                          className="text-base font-medium text-ink hover:text-brand hover:underline min-w-0 truncate"
                        >
                          {article.headline}
                        </Link>
                        <span className="meta-text shrink-0">{formatNepaliRelative(article.publishedAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {mostRecent && (
          <p className="meta-text mt-7 pt-4 border-t border-line/70">
            अद्यावधिक: {formatNepaliDateTime(mostRecent.publishedAt)}
          </p>
        )}
      </div>
    </section>
  );
}
