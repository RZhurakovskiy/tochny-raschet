import { renderOgImage, ogImageSize, ogImageContentType } from "@/lib/og-image";
import { ARTICLES, getArticleBySlug } from "@/lib/articles/registry";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export async function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  return renderOgImage(article?.title ?? "Статьи");
}
