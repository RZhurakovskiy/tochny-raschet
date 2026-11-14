import type { ReactNode } from "react";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq, type FaqItem } from "@/components/Faq";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { SourceNote } from "@/components/SourceNote";
import {
  getCategoryBySlug,
  getRelatedCalculators,
  type Calculator,
} from "@/lib/calculators/registry";
import { siteConfig } from "@/lib/site-config";

type CalculatorPageLayoutProps = {
  calculator: Calculator;
  /** ISO-дата последнего обновления данных, например "2026-08-24" */
  updatedAt: string;
  sourceLabel: string;
  sourceUrl: string;
  /** Сам интерактивный калькулятор (форма + результат) */
  children: ReactNode;
  /** Пояснительный текст/методика расчёта, 300–600 слов */
  explanation: ReactNode;
  faq?: FaqItem[];
};

export function CalculatorPageLayout({
  calculator,
  updatedAt,
  sourceLabel,
  sourceUrl,
  children,
  explanation,
  faq = [],
}: CalculatorPageLayoutProps) {
  const category = getCategoryBySlug(calculator.category);
  const related = getRelatedCalculators(calculator.slug);
  const url = `${siteConfig.url}/${calculator.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: calculator.title,
        description: calculator.description,
        url,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Any",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "RUB",
        },
      },
      {
        "@type": "WebPage",
        name: calculator.title,
        description: calculator.description,
        url,
        inLanguage: "ru-RU",
        datePublished: updatedAt,
        dateModified: updatedAt,
      },
    ],
  };

  return (
    <>
      <div className="print:hidden">
        <Breadcrumbs
          items={[
            ...(category ? [{ label: category.title }] : []),
            { label: calculator.shortTitle },
          ]}
        />
      </div>
      <article className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{calculator.title}</h1>
        <SourceNote updatedAt={updatedAt} sourceLabel={sourceLabel} sourceUrl={sourceUrl} />

        <div className="mt-6">{children}</div>

        <div className="print:hidden">
          <AdSlot />
        </div>

        <div className="mt-10 space-y-6 print:hidden">{explanation}</div>

        <div className="print:hidden">
          <Faq items={faq} />
          <RelatedCalculators calculators={related} />
        </div>

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
