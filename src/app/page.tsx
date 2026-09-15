import TodaysMechinagar from "@/components/TodaysMechinagar";
import ArticleCard from "@/components/ArticleCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import CategoryShortcuts from "@/components/CategoryShortcuts";
import { getLatestArticles } from "@/lib/content/articles";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 300;

export default function HomePage() {
  const latestArticles = getLatestArticles();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteConfig.name,
        alternateName: siteConfig.nameEn,
        url: siteConfig.url,
        description: siteConfig.descriptionNe,
      },
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
        inLanguage: "ne",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <TodaysMechinagar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h2 className="h-headline mb-2">पछिल्ला समाचार</h2>
            <div>
              {latestArticles.map((article, index) => (
                <ArticleCard
                  key={article.slug}
                  article={article}
                  variant={index === 0 ? "prominent" : "default"}
                />
              ))}
            </div>
          </div>

          <aside className="lg:col-span-1 flex flex-col gap-8">
            <NewsletterSignup compact />
            <div>
              <h2 className="h-section mb-3">श्रेणीहरू</h2>
              <CategoryShortcuts />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
