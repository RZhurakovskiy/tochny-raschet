"use client";

import { useEffect, useState } from "react";
import { GradientMeterBar } from "@/components/GradientMeterBar";
import { calculateMaternityBenefit, type MaternityLeaveType } from "@/lib/calculators/dekretnye";
import { formatCurrency } from "@/lib/format";
import { loadProfile } from "@/lib/profile";

const MIN_INCOME_2YEARS = 100_000;
const MAX_INCOME_2YEARS = 5_000_000;
const STEP = 20_000;
const DEFAULT_INCOME_2YEARS = 1_800_000;

const MAX_BENEFIT = calculateMaternityBenefit(MAX_INCOME_2YEARS, "multiple").benefit;

const LEAVE_TYPE_OPTIONS: { value: MaternityLeaveType; label: string }[] = [
  { value: "standard", label: "Обычные - 140 дней" },
  { value: "complicated", label: "Осложнённые - 156 дней" },
  { value: "multiple", label: "Многоплодная - 194 дня" },
];

export function DekretnyeWhatIfSlider() {
  const [income2Years, setIncome2Years] = useState(DEFAULT_INCOME_2YEARS);
  const [leaveType, setLeaveType] = useState<MaternityLeaveType>("standard");
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

  const { benefit } = calculateMaternityBenefit(income2Years, leaveType);

  return (
    <div className="mt-6 max-w-2xl rounded-xl border border-border bg-card p-5 print:hidden">
      <h3 className="text-sm font-semibold">А если доход другой?</h3>
      <p className="mt-1 text-xs text-muted">
        Потяните ползунок - результат выше не изменится, это просто быстрая прикидка для другого
        дохода.{" "}
        {prefilledFromProfile
          ? "Начальное значение подставлено из данных, которые вы вводили в других калькуляторах."
          : `Начальное значение (${formatCurrency(DEFAULT_INCOME_2YEARS)}) - условный пример, не ваши данные.`}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {LEAVE_TYPE_OPTIONS.map((option) => {
          const checked = option.value === leaveType;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setLeaveType(option.value)}
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
          <label htmlFor="dekretnye-what-if-income" className="text-sm text-muted">
            Доход за 2024 и 2025 годы
          </label>
          <span className="text-sm font-medium tabular-nums">{formatCurrency(income2Years)}</span>
        </div>
        <input
          id="dekretnye-what-if-income"
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
          label="Пособие одной суммой"
          formattedValue={formatCurrency(benefit)}
          value={benefit}
          max={MAX_BENEFIT}
        />
      </div>
    </div>
  );
}
