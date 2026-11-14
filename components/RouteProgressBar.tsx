"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Тонкая полоса загрузки вверху экрана при переходах между страницами. Сайт полностью
 * статический, а next/link предзагружает страницы, поэтому переход почти всегда мгновенный —
 * полоса появляется только если он всё же не мгновенный (с задержкой, чтобы не мигать зря).
 */
export function RouteProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const showTimeoutRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      // Не проверяем event.defaultPrevented: next/link сам вызывает preventDefault для
      // обычного клика, чтобы перехватить переход и сделать его клиентским - это ожидаемо,
      // а не сигнал пропустить обработку.
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement)?.closest("a");
      if (!anchor || anchor.target === "_blank") return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/")) return;
      if (href === window.location.pathname) return;

      showTimeoutRef.current = window.setTimeout(() => setVisible(true), 150);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    setVisible(false);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-accent-soft">
      <div className="h-full w-1/3 animate-route-progress rounded-full bg-accent" />
    </div>
  );
}
