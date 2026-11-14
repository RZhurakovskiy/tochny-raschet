"use client";

import { useEffect, useState } from "react";
import { GradientMeterBar } from "@/components/GradientMeterBar";
import { calculateAlimony, type ChildrenCount } from "@/lib/calculators/alimenty";
import { formatCurrency } from "@/lib/format";
import { loadProfile } from "@/lib/profile";

const MIN_INCOME = 20_000;
const MAX_INCOME = 500_000;
const STEP = 1_000;
const DEFAULT_INCOME = 80_000;

// Максимум по вертикальной шкале - алименты при максимальном доходе слайдера и самой большой
// доле (трое и более детей), чтобы полоса заполнялась предсказуемо на всём диапазоне слайдера.
const MAX_ALIMONY = calculateAlimony(MAX_INCOME, "threeOrMore").alimony;

const CHILDREN_OPTIONS: { value: ChildrenCount; label: string }[] = [
  { value: "one", label: "1 ребёнок" },
  { value: "two", label: "2 детей" },
  { value: "threeOrMore", label: "3 и более" },
];

export function AlimentyWhatIfSlider() {
  const [income, setIncome] = useState(DEFAULT_INCOME);
  const [childrenCount, setChildrenCount] = useState<ChildrenCount>("one");
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);

  // Подставляем сохранённый доход пользователя после монтирования - localStorage недоступен при SSR.
  useEffect(() => {
    const saved = loadProfile().monthlyIncome;
    if (saved !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIncome(Math.min(Math.max(saved, MIN_INCOME), MAX_INCOME));
      setPrefilledFromProfile(true);
    }
  }, []);

  const { alimony } = calculateAlimony(income, childrenCount);

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
        {CHILDREN_OPTIONS.map((option) => {
          const checked = option.value === childrenCount;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setChildrenCount(option.value)}
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
          <label htmlFor="alimenty-what-if-income" className="text-sm text-muted">
            Доход плательщика
          </label>
          <span className="text-sm font-medium tabular-nums">{formatCurrency(income)}</span>
        </div>
        <input
          id="alimenty-what-if-income"
          type="range"
          min={MIN_INCOME}
          max={MAX_INCOME}
          step={STEP}
          value={income}
          onChange={(e) => setIncome(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
      </div>

      <div className="mt-4">
        <GradientMeterBar
          label="Алименты в месяц"
          formattedValue={formatCurrency(alimony)}
          value={alimony}
          max={MAX_ALIMONY}
        />
      </div>
    </div>
  );
}
