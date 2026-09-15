import type { MetadataRoute } from "next";
import { getAllPublishedArticles } from "@/lib/content/articles";
import { categories } from "@/lib/data/categories";
import { siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: "hourly", priority: 1 },
    { url: `${siteConfig.url}/search`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteConfig.url}/newsletter`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteConfig.url}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteConfig.url}/submit`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteConfig.url}/category/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const articleRoutes: MetadataRoute.Sitemap = getAllPublishedArticles().map((a) => ({
    url: `${siteConfig.url}/article/${a.slug}`,
    lastModified: a.updatedAt ?? a.publishedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}
