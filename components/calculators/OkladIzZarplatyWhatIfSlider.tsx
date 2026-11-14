"use client";

import { useEffect, useState } from "react";
import { GradientMeterBar } from "@/components/GradientMeterBar";
import { calculateGrossFromNet } from "@/lib/calculators/oklad-iz-zarplaty";
import { formatCurrency } from "@/lib/format";
import { loadProfile } from "@/lib/profile";

const MIN_NET = 20_000;
const MAX_NET = 800_000;
const STEP = 5_000;
const DEFAULT_NET = 100_000;

const MAX_GROSS = calculateGrossFromNet(MAX_NET * 12).requiredGrossAnnual / 12;

export function OkladIzZarplatyWhatIfSlider() {
  const [netIncome, setNetIncome] = useState(DEFAULT_NET);
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);

  // Подставляем сохранённый доход пользователя после монтирования - localStorage недоступен при SSR.
  useEffect(() => {
    const saved = loadProfile().monthlyIncome;
    if (saved !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNetIncome(Math.min(Math.max(saved, MIN_NET), MAX_NET));
      setPrefilledFromProfile(true);
    }
  }, []);

  const { requiredGrossAnnual } = calculateGrossFromNet(netIncome * 12);
  const gross = requiredGrossAnnual / 12;

  return (
    <div className="mt-6 max-w-2xl rounded-xl border border-border bg-card p-5 print:hidden">
      <h3 className="text-sm font-semibold">А если сумма на руки другая?</h3>
      <p className="mt-1 text-xs text-muted">
        Потяните ползунок - результат выше не изменится, это просто быстрая прикидка для другой
        суммы.{" "}
        {prefilledFromProfile
          ? "Начальное значение подставлено из данных, которые вы вводили в других калькуляторах."
          : `Начальное значение (${formatCurrency(DEFAULT_NET)}) - условный пример, не ваши данные.`}
      </p>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="oklad-what-if-net" className="text-sm text-muted">
            Сумма на руки в месяц
          </label>
          <span className="text-sm font-medium tabular-nums">{formatCurrency(netIncome)}</span>
        </div>
        <input
          id="oklad-what-if-net"
          type="range"
          min={MIN_NET}
          max={MAX_NET}
          step={STEP}
          value={netIncome}
          onChange={(e) => setNetIncome(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
      </div>

      <div className="mt-4">
        <GradientMeterBar
          label="Нужный оклад в месяц"
          formattedValue={formatCurrency(gross)}
          value={gross}
          max={MAX_GROSS}
        />
      </div>
    </div>
  );
}
