import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/types";
import { formatNepaliRelative } from "@/lib/datetime";
import CategoryTag from "@/components/CategoryTag";

export default function ArticleCard({
  article,
  showImage = true,
  variant = "default",
}: {
  article: Article;
  showImage?: boolean;
  variant?: "default" | "prominent";
}) {
  const isProminent = variant === "prominent";
  const hasImage = showImage && article.featuredImage;

  return (
    <article
      className={`flex gap-4 sm:gap-5 py-6 border-b border-line last:border-b-0 ${
        isProminent ? "flex-col sm:flex-row" : ""
      }`}
    >
      {hasImage && (
        <Link
          href={`/article/${article.slug}`}
          className={`relative overflow-hidden rounded-sm bg-surface shrink-0 ${
            isProminent
              ? "block w-full sm:w-64 md:w-72 aspect-[16/10]"
              : "hidden sm:block w-32 md:w-40 aspect-[3/2]"
          }`}
        >
          <Image
            src={article.featuredImage!.src}
            alt={article.featuredImage!.alt}
            fill
            unoptimized
            className="object-cover"
            sizes={isProminent ? "(min-width: 640px) 288px, 100vw" : "160px"}
          />
        </Link>
      )}
      <div className="flex-1 min-w-0">
        <CategoryTag categorySlug={article.categorySlug} />
        <h3 className={`${isProminent ? "h-headline" : "h-card"} mt-1.5`}>
          <Link href={`/article/${article.slug}`} className="hover:underline">
            {article.headline}
          </Link>
        </h3>
        <p className={`summary-text mt-2 ${isProminent ? "line-clamp-3" : "line-clamp-2"}`}>
          {article.summary}
        </p>
        <time dateTime={article.publishedAt} className="meta-text mt-2.5 block">
          {formatNepaliRelative(article.publishedAt)}
        </time>
      </div>
    </article>
  );
}
