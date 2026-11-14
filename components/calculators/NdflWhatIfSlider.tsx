"use client";

import { useEffect, useState } from "react";
import { GradientMeterBar } from "@/components/GradientMeterBar";
import { calculateAnnualNdfl } from "@/lib/calculators/ndfl";
import { formatCurrency } from "@/lib/format";
import { loadProfile } from "@/lib/profile";

const MIN_INCOME = 20_000;
const MAX_INCOME = 1_000_000;
const STEP = 5_000;
const DEFAULT_INCOME = 150_000;

const MAX_NET = calculateAnnualNdfl(MAX_INCOME * 12).netAnnualIncome / 12;

export function NdflWhatIfSlider() {
  const [income, setIncome] = useState(DEFAULT_INCOME);
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

  const { netAnnualIncome } = calculateAnnualNdfl(income * 12);
  const net = netAnnualIncome / 12;

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

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="ndfl-what-if-income" className="text-sm text-muted">
            Доход в месяц (до вычета НДФЛ)
          </label>
          <span className="text-sm font-medium tabular-nums">{formatCurrency(income)}</span>
        </div>
        <input
          id="ndfl-what-if-income"
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
          label="На руки в месяц"
          formattedValue={formatCurrency(net)}
          value={net}
          max={MAX_NET}
        />
      </div>
    </div>
  );
}
