"use client";

import { useEffect, useRef, useState } from "react";
import { CALCULATOR_URL_SYNC_EVENT } from "@/components/Calculator";
import { GradientMeterBar } from "@/components/GradientMeterBar";
import { simulateExtraPayment, type ExtraPaymentStrategy } from "@/lib/calculators/ipoteka";
import { formatCurrency } from "@/lib/format";

const MAX_BALANCE = 20_000_000;
const EXTRA_PAYMENT_STEP = 10_000;

const STRATEGY_OPTIONS: { value: ExtraPaymentStrategy; label: string }[] = [
  { value: "reduceTerm", label: "Сократить срок" },
  { value: "reducePayment", label: "Снизить платёж" },
];

type LoanTerms = { balance: number; rate: number; months: number };

/**
 * Читает остаток долга/ставку/срок из query-строки этой же страницы - Calculator.tsx пишет туда
 * текущие значения основной формы (см. syncValuesToUrl) и рассылает CALCULATOR_URL_SYNC_EVENT
 * при каждом обновлении. Возвращает null, если реальных значений в URL ещё нет (форма выше не
 * заполнена) - в этом случае показывать в песочнице нечего, вместо цифр рисуем подсказку.
 */
function readLoanTermsFromUrl(): LoanTerms | null {
  const params = new URLSearchParams(window.location.search);
  const balance = Number(params.get("remainingBalance"));
  const rate = Number(params.get("annualRatePercent"));
  const months = Number(params.get("remainingMonths"));
  if (
    !(Number.isFinite(balance) && balance > 0) ||
    !(Number.isFinite(rate) && rate > 0) ||
    !(Number.isFinite(months) && months > 0)
  ) {
    return null;
  }
  return { balance, rate, months };
}

export function IpotekaExtraPaymentSlider() {
  const [terms, setTerms] = useState<LoanTerms | null>(null);
  const [extraPayment, setExtraPayment] = useState(0);
  const [strategy, setStrategy] = useState<ExtraPaymentStrategy>("reduceTerm");
  const hasSeededExtraPayment = useRef(false);

  useEffect(() => {
    function sync() {
      const found = readLoanTermsFromUrl();
      if (!found) return;
      setTerms(found);
      // Дефолт доплаты (10% от остатка) подставляем только один раз, при первом появлении
      // реальных данных - дальше это уже выбор пользователя, трогать его при каждом изменении
      // формы выше не нужно.
      if (!hasSeededExtraPayment.current) {
        hasSeededExtraPayment.current = true;
        setExtraPayment(
          Math.round((found.balance * 0.1) / EXTRA_PAYMENT_STEP) * EXTRA_PAYMENT_STEP,
        );
      }
    }
    sync();
    window.addEventListener(CALCULATOR_URL_SYNC_EVENT, sync);
    return () => window.removeEventListener(CALCULATOR_URL_SYNC_EVENT, sync);
  }, []);

  if (!terms) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-5 print:hidden">
        <h3 className="text-sm font-semibold">А если доплатить сейчас?</h3>
        <p className="mt-1 text-sm text-muted">
          Заполните расчёт выше (остаток долга, ставку и срок) - тогда здесь появится прикидка,
          насколько доплата сократит срок или платёж.
        </p>
      </div>
    );
  }

  const { balance, rate, months } = terms;
  const simulation = simulateExtraPayment(balance, rate, months, extraPayment, strategy);
  const maxExtraPayment = Math.min(balance, MAX_BALANCE);
  // Потолок для полосы - экономия при доплате всей суммы долга сразу (наглядный верхний край шкалы).
  const maxInterestSaved = simulateExtraPayment(
    balance,
    rate,
    months,
    balance,
    "reduceTerm",
  ).interestSaved;

  return (
    <div className="mt-6 max-w-2xl rounded-xl border border-border bg-card p-5 print:hidden">
      <h3 className="text-sm font-semibold">А если доплатить сейчас?</h3>
      <p className="mt-1 text-xs text-muted">
        Потяните ползунок - результат основного расчёта не изменится, это отдельная прикидка.
        Досрочное погашение без штрафов и комиссий банка законно в любой момент (ст. 810 ГК РФ).
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {STRATEGY_OPTIONS.map((option) => {
          const checked = option.value === strategy;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setStrategy(option.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                checked
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border hover:border-accent"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="ipoteka-extra-payment" className="text-sm text-muted">
            Доплата сейчас
          </label>
          <span className="text-sm font-medium tabular-nums">{formatCurrency(extraPayment)}</span>
        </div>
        <input
          id="ipoteka-extra-payment"
          type="range"
          min={0}
          max={maxExtraPayment}
          step={EXTRA_PAYMENT_STEP}
          value={Math.min(extraPayment, maxExtraPayment)}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
      </div>

      <div className="mt-4">
        <GradientMeterBar
          label="Экономия на процентах"
          formattedValue={formatCurrency(simulation.interestSaved)}
          value={simulation.interestSaved}
          max={Math.max(maxInterestSaved, 1)}
        />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {simulation.payoffComplete ? (
          <div className="col-span-2 font-medium text-accent-soft-foreground">
            Ипотека полностью закрыта этой доплатой
          </div>
        ) : strategy === "reduceTerm" ? (
          <div>
            <dt className="text-muted">Новый срок</dt>
            <dd className="font-medium">
              {simulation.newMonths} мес.{" "}
              <span className="text-xs text-muted">(−{simulation.monthsSaved} мес.)</span>
            </dd>
          </div>
        ) : (
          <div>
            <dt className="text-muted">Новый платёж</dt>
            <dd className="font-medium">{formatCurrency(simulation.newMonthlyPayment)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
