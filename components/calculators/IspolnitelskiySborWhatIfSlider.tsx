"use client";

import { useState } from "react";
import { GradientMeterBar } from "@/components/GradientMeterBar";
import {
  calculateMoneyEnforcementFee,
  type DebtorType,
} from "@/lib/calculators/ispolnitelskiy-sbor";
import { formatCurrency } from "@/lib/format";

const MIN_DEBT = 10_000;
const MAX_DEBT = 2_000_000;
const STEP = 10_000;
const DEFAULT_DEBT = 80_000;

const MAX_FEE = calculateMoneyEnforcementFee(MAX_DEBT, "legalEntity").fee;

const DEBTOR_TYPE_OPTIONS: { value: DebtorType; label: string }[] = [
  { value: "individual", label: "Физлицо или ИП" },
  { value: "legalEntity", label: "Юридическое лицо" },
];

export function IspolnitelskiySborWhatIfSlider() {
  const [debt, setDebt] = useState(DEFAULT_DEBT);
  const [debtorType, setDebtorType] = useState<DebtorType>("individual");

  const { fee } = calculateMoneyEnforcementFee(debt, debtorType);

  return (
    <div className="mt-6 max-w-2xl rounded-xl border border-border bg-card p-5 print:hidden">
      <h3 className="text-sm font-semibold">А если долг другой?</h3>
      <p className="mt-1 text-xs text-muted">
        Потяните ползунок - результат выше не изменится, это просто быстрая прикидка для другой
        суммы долга. Начальное значение ({formatCurrency(DEFAULT_DEBT)}) - условный пример, не ваши
        данные.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {DEBTOR_TYPE_OPTIONS.map((option) => {
          const checked = option.value === debtorType;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setDebtorType(option.value)}
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
          <label htmlFor="ispolnitelskiy-sbor-what-if-debt" className="text-sm text-muted">
            Сумма долга
          </label>
          <span className="text-sm font-medium tabular-nums">{formatCurrency(debt)}</span>
        </div>
        <input
          id="ispolnitelskiy-sbor-what-if-debt"
          type="range"
          min={MIN_DEBT}
          max={MAX_DEBT}
          step={STEP}
          value={debt}
          onChange={(e) => setDebt(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
      </div>

      <div className="mt-4">
        <GradientMeterBar
          label="Исполнительский сбор"
          formattedValue={formatCurrency(fee)}
          value={fee}
          max={MAX_FEE}
        />
      </div>
    </div>
  );
}
