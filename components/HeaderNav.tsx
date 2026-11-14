"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { Calculator, Category } from "@/lib/calculators/registry";

type CategoryWithCalculators = {
  category: Category;
  calculators: Calculator[];
};

/**
 * Полная навигация с выпадающими списками по категориям - для широких экранов. Ряд переносится
 * на вторую строку (flex-wrap), если категории не помещаются в одну - вместо горизontального
 * скролла: пользователь сразу видит все разделы, не пропуская их за краем экрана.
 */
export function DesktopNav({ items }: { items: CategoryWithCalculators[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openSlug) return;

    function handlePointerDown(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenSlug(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenSlug(null);
    }
    // Закрываем при ресайзе, а не пересчитываем позицию - проще спрятать меню, чем гоняться
    // за координатами кнопки, если из-за переноса строк она сдвинулась.
    function handleResize() {
      setOpenSlug(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [openSlug]);

  function toggleCategory(slug: string, event: ReactMouseEvent<HTMLButtonElement>) {
    if (openSlug === slug) {
      setOpenSlug(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom, left: rect.left });
    setOpenSlug(slug);
  }

  return (
    <div className="hidden min-w-0 sm:block">
      <nav
        ref={navRef}
        aria-label="Разделы калькуляторов"
        className="flex flex-wrap gap-1 rounded-2xl border border-border/70 bg-card/60 p-1 text-sm shadow-sm"
      >
        {items.map(({ category, calculators }) => {
          const isOpen = openSlug === category.slug;
          return (
            <div key={category.slug} className="shrink-0">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="true"
                onClick={(event) => toggleCategory(category.slug, event)}
                className={`cursor-pointer whitespace-nowrap rounded-xl px-3 py-2 transition-all ${
                  isOpen
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted hover:bg-accent-soft hover:text-accent-soft-foreground"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {category.title}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="m4 6 4 4 4-4" />
                  </svg>
                </span>
              </button>
              {isOpen && dropdownPos && (
                <ul
                  // fixed с координатами от getBoundingClientRect() - не зависит от того, на какой
                  // из перенесённых строк ряда категорий стоит кнопка, и не клиппится overflow
                  // родителя.
                  className="fixed z-20 min-w-60 rounded-2xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur"
                  style={{ top: dropdownPos.top, left: dropdownPos.left }}
                >
                  {calculators.map((calculator) => (
                    <li key={calculator.slug}>
                      <Link
                        href={`/${calculator.slug}`}
                        onClick={() => setOpenSlug(null)}
                        className="block rounded-xl px-3 py-2.5 text-muted transition-colors hover:bg-accent-soft hover:text-accent-soft-foreground"
                      >
                        {calculator.shortTitle}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Кнопка-гамбургер с выпадающей панелью-аккордеоном - на узких экранах вместо ряда из 5+
 * кнопок категорий, который иначе переносится в несколько строк и занимает весь первый экран.
 */
export function MobileNav({ items }: { items: CategoryWithCalculators[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [menuTop, setMenuTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function toggleMenu() {
    if (!menuOpen && containerRef.current) {
      setMenuTop(containerRef.current.getBoundingClientRect().bottom);
    }
    setMenuOpen((open) => !open);
  }

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div ref={containerRef} className="relative sm:hidden">
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-haspopup="true"
        aria-label={menuOpen ? "Закрыть меню разделов" : "Открыть меню разделов"}
        onClick={toggleMenu}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/60 text-muted shadow-sm transition-colors hover:bg-accent-soft hover:text-accent-soft-foreground"
      >
        {menuOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        )}
      </button>

      {menuOpen && (
        // fixed, а не absolute - панель шире (w-72), чем кнопка-гамбургер, а справа от кнопки в
        // строке хедера есть ещё "Статьи" и переключатель темы. absolute right-0 позиционировался
        // бы от узкой кнопки и уезжал за левый край экрана (найдено живым тестом в браузере).
        // fixed + right, посчитанный от вьюпорта, не зависит от того, где кнопка стоит в ряду.
        <div
          className="fixed right-4 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card/95 py-2 shadow-xl backdrop-blur"
          style={{ top: menuTop }}
        >
          {items.map(({ category, calculators }) => {
            const isOpen = openSlug === category.slug;
            return (
              <div key={category.slug}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenSlug(isOpen ? null : category.slug)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors ${isOpen ? "bg-accent-soft text-accent-soft-foreground" : "hover:bg-accent-soft hover:text-accent-soft-foreground"}`}
                >
                  {category.title}
                  <span aria-hidden="true" className="text-muted">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <ul className="pb-1">
                    {calculators.map((calculator) => (
                      <li key={calculator.slug}>
                        <Link
                          href={`/${calculator.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="mx-1 block rounded-lg px-4 py-2 text-sm text-muted transition-colors hover:bg-accent-soft hover:text-accent-soft-foreground"
                        >
                          {calculator.shortTitle}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          <Link
            href="/moi-raschety"
            onClick={() => setMenuOpen(false)}
            className="mt-1 block border-t border-border px-4 py-3 text-sm font-medium hover:bg-accent-soft hover:text-accent-soft-foreground"
          >
            Мои расчёты
          </Link>
        </div>
      )}
    </div>
  );
}
