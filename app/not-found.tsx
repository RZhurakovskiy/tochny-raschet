import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCalculators } from "@/lib/calculators/registry";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const calculators = getPublishedCalculators();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-6xl font-bold text-accent">404</p>
      <h1 className="mt-2 text-3xl font-bold">Страница не найдена</h1>
      <p className="mt-3 text-muted">
        Такой страницы нет - возможно, она была перемещена или в ссылке опечатка. Вот популярные
        калькуляторы, которые могут быть вам нужны:
      </p>
      <ul className="mt-8 grid gap-3 text-left sm:grid-cols-2">
        {calculators.map((calculator) => (
          <li key={calculator.slug}>
            <Link
              href={`/${calculator.slug}`}
              className="block rounded-xl border border-border p-4 transition-colors hover:border-accent hover:bg-accent-soft"
            >
              <span className="font-medium">{calculator.shortTitle}</span>
              <span className="mt-1 block text-sm text-muted">{calculator.description}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="mt-8 inline-block text-accent underline hover:no-underline">
        Вернуться на главную
      </Link>
    </div>
  );
}
