import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

type BuildMetadataParams = {
  title: string;
  description: string;
  /** Путь без домена, например "/ndfl" или "/" */
  path: string;
  /** Запретить индексацию (например, для ещё не готовых страниц-калькуляторов) */
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  noIndex = false,
}: BuildMetadataParams): Metadata {
  const url = `${siteConfig.url}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
  };
}
