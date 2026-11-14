"use client";

import { useEffect, useState } from "react";
import { GradientMeterBar } from "@/components/GradientMeterBar";
import { calculateSickLeaveBenefit } from "@/lib/calculators/bolnichnyy";
import { formatCurrency } from "@/lib/format";
import { loadProfile } from "@/lib/profile";

const MIN_INCOME_2YEARS = 100_000;
const MAX_INCOME_2YEARS = 5_000_000;
const STEP = 20_000;
const DEFAULT_INCOME_2YEARS = 1_800_000;
const DAYS = 7;
const FLAT_NDFL_RATE = 0.13;

const MAX_NET =
  calculateSickLeaveBenefit(MAX_INCOME_2YEARS, 10, DAYS).benefit * (1 - FLAT_NDFL_RATE);

const INSURANCE_YEARS_OPTIONS = [
  { value: 3, label: "До 5 лет стажа" },
  { value: 6, label: "5-8 лет стажа" },
  { value: 10, label: "От 8 лет стажа" },
];

export function BolnichnyyWhatIfSlider() {
  const [income2Years, setIncome2Years] = useState(DEFAULT_INCOME_2YEARS);
  const [insuranceYears, setInsuranceYears] = useState(6);
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);

  // Подставляем сохранённый доход пользователя после монтирования - localStorage недоступен при SSR.
  useEffect(() => {
    const saved = loadProfile().monthlyIncome;
    if (saved !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIncome2Years(Math.min(Math.max(saved * 24, MIN_INCOME_2YEARS), MAX_INCOME_2YEARS));
      setPrefilledFromProfile(true);
    }
  }, []);

  const { benefit } = calculateSickLeaveBenefit(income2Years, insuranceYears, DAYS);
  const net = benefit * (1 - FLAT_NDFL_RATE);

  return (
    <div className="mt-6 max-w-2xl rounded-xl border border-border bg-card p-5 print:hidden">
      <h3 className="text-sm font-semibold">А если доход или стаж другой?</h3>
      <p className="mt-1 text-xs text-muted">
        Потяните ползунок - результат выше не изменится, это просто быстрая прикидка для {DAYS} дней
        больничного.{" "}
        {prefilledFromProfile
          ? "Начальное значение дохода подставлено из данных, которые вы вводили в других калькуляторах."
          : `Начальное значение (${formatCurrency(DEFAULT_INCOME_2YEARS)}) - условный пример, не ваши данные.`}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {INSURANCE_YEARS_OPTIONS.map((option) => {
          const checked = option.value === insuranceYears;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setInsuranceYears(option.value)}
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
          <label htmlFor="bolnichnyy-what-if-income" className="text-sm text-muted">
            Доход за 2024 и 2025 годы
          </label>
          <span className="text-sm font-medium tabular-nums">{formatCurrency(income2Years)}</span>
        </div>
        <input
          id="bolnichnyy-what-if-income"
          type="range"
          min={MIN_INCOME_2YEARS}
          max={MAX_INCOME_2YEARS}
          step={STEP}
          value={income2Years}
          onChange={(e) => setIncome2Years(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
      </div>

      <div className="mt-4">
        <GradientMeterBar
          label={`Пособие на руки за ${DAYS} дней`}
          formattedValue={formatCurrency(net)}
          value={net}
          max={MAX_NET}
        />
      </div>
    </div>
  );
}
