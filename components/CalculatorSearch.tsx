"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Category, Calculator } from "@/lib/calculators/registry";

type CategoryWithCalculators = {
  category: Category;
  calculators: Calculator[];
};

type CalculatorSearchProps = {
  items: CategoryWithCalculators[];
};

function matchesQuery(calculator: Calculator, query: string): boolean {
  const haystack = [calculator.title, calculator.shortTitle, ...calculator.secondaryKeywords]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function CalculatorSearch({ items }: CalculatorSearchProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items
      .map(({ category, calculators }) => ({
        category,
        calculators: calculators.filter((calculator) => matchesQuery(calculator, normalized)),
      }))
      .filter(({ calculators }) => calculators.length > 0);
  }, [items, query]);

  return (
    <div>
      <label htmlFor="calculator-search" className="sr-only">
        Поиск калькулятора
      </label>
      <input
        id="calculator-search"
        type="search"
        placeholder="Поиск калькулятора, например «отпускные»"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2.5 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
      />

      <div className="mt-8 grid gap-8 sm:grid-cols-2" aria-live="polite">
        {filtered.length === 0 && (
          <p className="text-sm text-muted sm:col-span-2">
            Ничего не нашлось. Посмотрите полный список калькуляторов в футере.
          </p>
        )}
        {filtered.map(({ category, calculators }) => (
          <section key={category.slug}>
            <h2 className="text-lg font-semibold">{category.title}</h2>
            <p className="mt-1 text-sm text-muted">{category.description}</p>
            <ul className="mt-3 space-y-2">
              {calculators.map((calculator) => (
                <li key={calculator.slug}>
                  <Link
                    href={`/${calculator.slug}`}
                    className="block rounded-xl border border-border p-3 transition-colors hover:border-accent hover:bg-accent-soft"
                  >
                    {calculator.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
