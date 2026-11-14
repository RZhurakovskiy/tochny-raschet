"use client";

import { useEffect, useState } from "react";
import { APP_VERSION } from "@/lib/app-version";

const TOUR_KEY = `tochny-raschet-tour-${APP_VERSION}`;
const STEPS = [
  {
    eyebrow: "Добро пожаловать",
    title: "Все расчёты в одном месте",
    text: "НДФЛ, отпускные, больничные, алименты, ипотека и другие жизненные задачи собраны в понятных разделах.",
    icon: "▦",
  },
  {
    eyebrow: "Понятный результат",
    title: "Считайте и проверяйте",
    text: "Результат пересчитывается сразу, а рядом есть формула, источник закона и дата последней проверки данных.",
    icon: "✓",
  },
  {
    eyebrow: "Ваши расчёты",
    title: "Сохраняйте и делитесь",
    text: "Возвращайтесь к последним расчётам, копируйте ссылку и отправляйте готовый результат близким или коллегам.",
    icon: "↗",
  },
] as const;

export function AppTour() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(TOUR_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  function finish() {
    try {
      window.localStorage.setItem(TOUR_KEY, "seen");
    } catch {
      // The tour can still be dismissed when storage is unavailable.
    }
    setOpen(false);
  }

  if (!open) return null;
  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-tour-title"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-accent-soft via-card to-card px-6 pb-7 pt-6">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {current.eyebrow}
            </span>
            <button
              type="button"
              onClick={finish}
              className="text-sm text-muted hover:text-foreground"
            >
              Пропустить
            </button>
          </div>
          <div className="relative mt-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl font-semibold text-accent-foreground shadow-lg">
            {current.icon}
          </div>
          <h2 id="app-tour-title" className="relative mt-6 text-2xl font-bold tracking-tight">
            {current.title}
          </h2>
          <p className="relative mt-3 text-sm leading-6 text-muted">{current.text}</p>
        </div>
        <div className="flex items-center justify-between gap-4 px-6 py-5">
          <div className="flex gap-1.5" aria-label={`Шаг ${step + 1} из ${STEPS.length}`}>
            {STEPS.map((item, index) => (
              <span
                key={item.title}
                className={`h-1.5 rounded-full transition-all ${index === step ? "w-7 bg-accent" : "w-1.5 bg-border"}`}
              />
            ))}
          </div>
          {step === STEPS.length - 1 ? (
            <button
              type="button"
              onClick={finish}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
            >
              Начать
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((value) => value + 1)}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
            >
              Далее
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
