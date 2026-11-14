import Link from "next/link";
import { CATEGORIES, getCalculatorsByCategory } from "@/lib/calculators/registry";
import { DesktopNav, MobileNav } from "@/components/HeaderNav";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const items = CATEGORIES.map((category) => ({
    category,
    calculators: getCalculatorsByCategory(category.slug),
  })).filter(({ calculators }) => calculators.length > 0);

  return (
    <header className="border-b border-border print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-4">
        {/* Верхняя строка: лого + служебные ссылки. Разделы калькуляторов - строкой ниже, а не
            в этом же ряду, чтобы не тесниться со "Статьи" и не уходить в горизонтальный
            скролл - вместо этого ряд категорий сам переносится на вторую строку при нехватке места. */}
        <div className="flex items-center gap-4">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <MobileNav items={items} />
            <Link
              href="/moi-raschety"
              className="hidden shrink-0 rounded-md px-3 py-2 text-sm hover:bg-accent-soft hover:text-accent-soft-foreground sm:block"
            >
              Мои расчёты
            </Link>
            <Link
              href="/blog"
              className="shrink-0 rounded-md px-3 py-2 text-sm hover:bg-accent-soft hover:text-accent-soft-foreground"
            >
              Статьи
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="mt-3">
          <DesktopNav items={items} />
        </div>
      </div>
    </header>
  );
}
