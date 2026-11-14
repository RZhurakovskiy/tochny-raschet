"use client";

import { useEffect, useState } from "react";
import { GradientMeterBar } from "@/components/GradientMeterBar";
import { calculateSeveranceBenefit } from "@/lib/calculators/vykhodnoe-posobie";
import { formatCurrency } from "@/lib/format";
import { loadProfile } from "@/lib/profile";

const MIN_INCOME = 100_000;
const MAX_INCOME = 3_000_000;
const STEP = 20_000;
const DEFAULT_INCOME = 960_000;

const MAX_BENEFIT = calculateSeveranceBenefit(MAX_INCOME, true, true).benefit;

export function VykhodnoePosobieWhatIfSlider() {
  const [income12Months, setIncome12Months] = useState(DEFAULT_INCOME);
  const [month2Paid, setMonth2Paid] = useState(false);
  const [month3Paid, setMonth3Paid] = useState(false);
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);

  // Подставляем сохранённый доход пользователя после монтирования - localStorage недоступен при SSR.
  useEffect(() => {
    const saved = loadProfile().monthlyIncome;
    if (saved !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIncome12Months(Math.min(Math.max(saved * 12, MIN_INCOME), MAX_INCOME));
      setPrefilledFromProfile(true);
    }
  }, []);

  const { benefit } = calculateSeveranceBenefit(income12Months, month2Paid, month3Paid);

  function toggleMonth2() {
    const next = !month2Paid;
    setMonth2Paid(next);
    if (!next) setMonth3Paid(false);
  }

  function toggleMonth3() {
    const next = !month3Paid;
    setMonth3Paid(next);
    if (next) setMonth2Paid(true);
  }

  return (
    <div className="mt-6 max-w-2xl rounded-xl border border-border bg-card p-5 print:hidden">
      <h3 className="text-sm font-semibold">А если доход другой?</h3>
      <p className="mt-1 text-xs text-muted">
        Потяните ползунок - результат выше не изменится, это просто быстрая прикидка для другого
        дохода.{" "}
        {prefilledFromProfile
          ? "Начальное значение подставлено из данных, которые вы вводили в других калькуляторах."
          : `Начальное значение (${formatCurrency(DEFAULT_INCOME)}) - условный пример, не ваши данные.`}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleMonth2}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            month2Paid
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border hover:border-accent"
          }`}
        >
          + 2-й месяц
        </button>
        <button
          type="button"
          onClick={toggleMonth3}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            month3Paid
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border hover:border-accent"
          }`}
        >
          + 3-й месяц
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="vykhodnoe-posobie-what-if-income" className="text-sm text-muted">
            Доход за последние 12 месяцев
          </label>
          <span className="text-sm font-medium tabular-nums">{formatCurrency(income12Months)}</span>
        </div>
        <input
          id="vykhodnoe-posobie-what-if-income"
          type="range"
          min={MIN_INCOME}
          max={MAX_INCOME}
          step={STEP}
          value={income12Months}
          onChange={(e) => setIncome12Months(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
      </div>

      <div className="mt-4">
        <GradientMeterBar
          label="Пособие на руки"
          formattedValue={formatCurrency(benefit)}
          value={benefit}
          max={MAX_BENEFIT}
        />
      </div>
    </div>
  );
}
