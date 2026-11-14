import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq, type FaqItem } from "@/components/Faq";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { SourceNote } from "@/components/SourceNote";
import { CALCULATORS, type Calculator } from "@/lib/calculators/registry";
import { siteConfig } from "@/lib/site-config";
import type { Article } from "@/lib/articles/registry";

type ArticlePageLayoutProps = {
  article: Article;
  children: ReactNode;
  faq?: FaqItem[];
};

export function ArticlePageLayout({ article, children, faq = [] }: ArticlePageLayoutProps) {
  const relatedCalculators: Calculator[] = article.relatedCalculatorSlugs
    .map((slug) => CALCULATORS.find((calculator) => calculator.slug === slug))
    .filter((calculator): calculator is Calculator => Boolean(calculator));

  const url = `${siteConfig.url}/blog/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.metaDescription,
        url,
        inLanguage: "ru-RU",
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        author: { "@type": "Person", name: article.author },
      },
    ],
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Статьи", href: "/blog" }, { label: article.title }]} />
      <article className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{article.title}</h1>
        <SourceNote
          updatedAt={article.dataUpdatedAt}
          sourceLabel={article.sourceLabel}
          sourceUrl={article.sourceUrl}
        />

        <div className="mt-8 space-y-6">{children}</div>

        <Faq items={faq} />
        <RelatedCalculators calculators={relatedCalculators} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </article>
    </>
  );
}
