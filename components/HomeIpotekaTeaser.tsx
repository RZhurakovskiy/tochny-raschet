"use client";

import { useState } from "react";
import Link from "next/link";
import { GradientMeterBar } from "@/components/GradientMeterBar";
import { simulateExtraPayment } from "@/lib/calculators/ipoteka";
import { formatCurrency } from "@/lib/format";

// Условный пример для главной - остаток/ставка/срок совпадают с проверенным примером на
// /ipoteka-dosrochnoe-pogashenie (см. buildCalendarReminder-соседний расчёт в этом же файле),
// не ввод пользователя. Витрина живого пересчёта, а не самостоятельный расчёт.
const DEMO_BALANCE = 5_000_000;
const DEMO_RATE = 18;
const DEMO_MONTHS = 180;
const STEP = 10_000;
const DEFAULT_EXTRA_PAYMENT = 500_000;

const MAX_INTEREST_SAVED = simulateExtraPayment(
  DEMO_BALANCE,
  DEMO_RATE,
  DEMO_MONTHS,
  DEMO_BALANCE,
  "reduceTerm",
).interestSaved;

/**
 * Живая витрина главного отличия сайта от обычных калькуляторов - пересчёт без кнопки
 * "Рассчитать", прямо на первом экране. Сценарий фиксированный (условный, не ввод посетителя) -
 * задача не посчитать чью-то конкретную ипотеку, а за 2 секунды показать, что инструмент живой.
 */
export function HomeIpotekaTeaser() {
  const [extraPayment, setExtraPayment] = useState(DEFAULT_EXTRA_PAYMENT);
  const simulation = simulateExtraPayment(
    DEMO_BALANCE,
    DEMO_RATE,
    DEMO_MONTHS,
    extraPayment,
    "reduceTerm",
  );

  return (
    <section className="relative overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-accent-soft via-card to-card p-6 sm:p-8">
      <h2 className="text-xl font-bold sm:text-2xl">А если доплатить ипотеку сейчас?</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Потяните ползунок - пересчитывается вживую, без кнопки «Рассчитать». Остаток 5 000 000 ₽
        под 18% годовых, осталось 15 лет - условный пример, не ваши данные. Начальная доплата
        (500 000 ₽) тоже пример, реальные цифры вводятся на странице калькулятора.
      </p>

      <div className="mt-6 max-w-xl">
        <div className="flex items-baseline justify-between">
          <label htmlFor="home-ipoteka-extra" className="text-sm text-muted">
            Доплата сейчас
          </label>
          <span className="text-sm font-medium tabular-nums">{formatCurrency(extraPayment)}</span>
        </div>
        <input
          id="home-ipoteka-extra"
          type="range"
          min={0}
          max={DEMO_BALANCE}
          step={STEP}
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
      </div>

      <div className="mt-5 max-w-xl">
        <GradientMeterBar
          label="Экономия на процентах"
          formattedValue={formatCurrency(simulation.interestSaved)}
          value={simulation.interestSaved}
          max={Math.max(MAX_INTEREST_SAVED, 1)}
        />
      </div>

      <p className="mt-3 text-sm font-medium text-accent-soft-foreground" aria-live="polite">
        {simulation.payoffComplete
          ? "Ипотека закрыта полностью этой доплатой"
          : `Срок сократится на ${simulation.monthsSaved} мес.`}
      </p>

      <p className="mt-6 max-w-xl text-sm text-muted">
        На странице калькулятора - разбор расчёта по шагам со ссылками на закон, раздел вычета по
        процентам между супругами и напоминание о сроке выплаты в календарь.
      </p>

      <Link
        href="/ipoteka-dosrochnoe-pogashenie"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
      >
        Открыть калькулятор со своими цифрами
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </section>
  );
}
