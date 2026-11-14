import Link from "next/link";
import { CATEGORIES, getCalculatorsByCategory } from "@/lib/calculators/registry";
import { siteConfig } from "@/lib/site-config";
import { APP_VERSION } from "@/lib/app-version";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4">
          {CATEGORIES.map((category) => {
            const calculators = getCalculatorsByCategory(category.slug);
            if (calculators.length === 0) return null;
            return (
              <div key={category.slug}>
                <h2 className="mb-2 text-sm font-semibold">{category.title}</h2>
                <ul className="space-y-1 text-sm text-muted">
                  {calculators.map((calculator) => (
                    <li key={calculator.slug}>
                      <Link href={`/${calculator.slug}`} className="hover:text-accent">
                        {calculator.shortTitle}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted">
          <p>
            © {year} {siteConfig.name}. Все расчёты носят справочный характер.
          </p>
          <span className="text-xs text-muted/70">Версия {APP_VERSION}</span>
          <nav aria-label="Информация о проекте" className="flex gap-4">
            <Link href="/moi-raschety" className="hover:text-accent">
              Мои расчёты
            </Link>
            <Link href="/blog" className="hover:text-accent">
              Статьи
            </Link>
            <Link href="/o-proekte" className="hover:text-accent">
              О проекте
            </Link>
            <Link href="/kak-schitaem" className="hover:text-accent">
              Как мы считаем
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
