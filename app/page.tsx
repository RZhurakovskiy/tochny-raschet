import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  CATEGORIES,
  getCalculatorsByCategory,
  getPopularNowCalculators,
} from "@/lib/calculators/registry";
import { QuickIncomeWidget } from "@/components/QuickIncomeWidget";
import { CalculatorSearch } from "@/components/CalculatorSearch";
import { HomeIpotekaTeaser } from "@/components/HomeIpotekaTeaser";

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} - калькуляторы жизненных задач`,
  description: siteConfig.description,
  path: "/",
});

export default function Home() {
  const popularNow = getPopularNowCalculators();
  const items = CATEGORIES.map((category) => ({
    category,
    calculators: getCalculatorsByCategory(category.slug),
  })).filter(({ calculators }) => calculators.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">
        Калькуляторы <span className="text-accent">жизненных задач</span>
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Бесплатные онлайн-калькуляторы зарплаты, отпускных, больничного, алиментов, ипотеки и других
        денежных и юридических задач - без регистрации, по актуальным формулам 2026 года, с разбором
        расчёта по шагам и живым пересчётом там, где это важно.
      </p>

      <div className="mt-10">
        <HomeIpotekaTeaser />
      </div>

      <div className="mt-10">
        <QuickIncomeWidget />
      </div>

      {popularNow.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Популярное сейчас</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popularNow.map((calculator) => (
              <Link
                key={calculator.slug}
                href={`/${calculator.slug}`}
                className="block rounded-xl border border-border p-3 transition-colors hover:border-accent hover:bg-accent-soft"
              >
                {calculator.shortTitle}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10">
        <CalculatorSearch items={items} />
      </div>

      <div className="mt-12 flex flex-wrap gap-4 rounded-2xl border border-border bg-card p-5 text-sm">
        <p className="text-muted">
          Все расчёты носят справочный характер и не заменяют консультацию бухгалтера или юриста.
        </p>
        <div className="flex gap-4">
          <Link href="/o-proekte" className="font-medium text-accent hover:underline">
            О проекте
          </Link>
          <Link href="/kak-schitaem" className="font-medium text-accent hover:underline">
            Как мы считаем
          </Link>
        </div>
      </div>
    </div>
  );
}
