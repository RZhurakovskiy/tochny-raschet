import { siteConfig } from "@/lib/site-config";

declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...rest: unknown[]) => void;
  }
}

/** Отправляет цель в Яндекс.Метрику, если счётчик подключён. Безопасно вызывать всегда. */
export function reachGoal(goalName: string): void {
  if (typeof window === "undefined" || typeof window.ym !== "function") return;

  const counterId = Number(siteConfig.yandexMetrikaId);
  if (!counterId) return;

  window.ym(counterId, "reachGoal", goalName);
}
