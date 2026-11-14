import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { getPublishedCalculators } from "@/lib/calculators/registry";
import { getPublishedArticles } from "@/lib/articles/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/o-proekte`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteConfig.url}/kak-schitaem`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteConfig.url}/blog`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const calculatorPages: MetadataRoute.Sitemap = getPublishedCalculators().map((calculator) => ({
    url: `${siteConfig.url}/${calculator.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const articlePages: MetadataRoute.Sitemap = getPublishedArticles().map((article) => ({
    url: `${siteConfig.url}/blog/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...calculatorPages, ...articlePages];
}
