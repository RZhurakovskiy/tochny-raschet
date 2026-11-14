import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getPublishedArticles } from "@/lib/articles/registry";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = buildMetadata({
  title: "Статьи",
  description:
    "Разборы жизненных ситуаций простым языком: что положено по закону, в каком порядке оформлять выплаты и какие калькуляторы использовать на каждом шаге.",
  path: "/blog",
});

export default function BlogIndexPage() {
  const articles = getPublishedArticles();

  return (
    <>
      <Breadcrumbs items={[{ label: "Статьи" }]} />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Статьи</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Разборы целых жизненных ситуаций - не один расчёт, а последовательность того, что положено
          по закону и в каком порядке это оформлять, со ссылками на нужные калькуляторы на каждом
          шаге.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent hover:bg-accent-soft"
            >
              <div className="text-xs text-muted">{formatDate(article.publishedAt)}</div>
              <h2 className="mt-1 text-lg font-semibold">{article.title}</h2>
              <p className="mt-2 text-sm text-muted">{article.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
