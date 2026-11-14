"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { calculateAnnualNdfl } from "@/lib/calculators/ndfl";
import { calculateAlimony } from "@/lib/calculators/alimenty";
import { calculateChildDeductionSavings } from "@/lib/calculators/detskie-vychety";
import { formatCurrency } from "@/lib/format";
import { loadProfile, saveProfileValue } from "@/lib/profile";

const DEBOUNCE_MS = 250;

export function QuickIncomeWidget() {
  const [rawIncome, setRawIncome] = useState("");
  const [income, setIncome] = useState<number | null>(null);

  // Подставляет сохранённую зарплату при заходе на сайт - виджет сам заявляет, что "запоминается
  // в браузере", но раньше только писал в профиль, а собственное поле при перезагрузке не читал.
  // Нельзя сделать это в начальном useState: localStorage недоступен при SSR-рендере клиентского
  // компонента, поэтому чтение сознательно вынесено в эффект (внешний источник - профиль в браузере).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = loadProfile().monthlyIncome;
    if (saved !== undefined) setRawIncome(String(saved));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const timer = setTimeout(() => {
      const value = Number(rawIncome);
      const isValid = rawIncome !== "" && !Number.isNaN(value) && value > 0;
      setIncome(isValid ? value : null);
      if (isValid) saveProfileValue("monthlyIncome", value);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [rawIncome]);

  const annualIncome = income ? income * 12 : 0;
  const ndfl = income ? calculateAnnualNdfl(annualIncome).totalTax / 12 : 0;
  const alimonyOneChild = income ? calculateAlimony(income, "one").alimony : 0;
  const deductionSavings = income
    ? calculateChildDeductionSavings(income, 1, 0, false).avgMonthlySavings
    : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <label htmlFor="quick-income" className="block text-sm font-medium">
        Введите зарплату в месяц - и сразу увидите основные расчёты
      </label>
      <div className="relative mt-2 max-w-xs">
        <input
          id="quick-income"
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="Например, 150000"
          value={rawIncome}
          onChange={(e) => setRawIncome(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-12 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
          ₽
        </span>
      </div>

      {income !== null && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-live="polite">
          <Link
            href="/ndfl"
            className="rounded-xl border border-border p-3 transition-colors hover:border-accent hover:bg-accent-soft"
          >
            <div className="text-xs text-muted">НДФЛ в месяц (13%)</div>
            <div className="mt-1 text-lg font-semibold">{formatCurrency(ndfl)}</div>
            <div className="mt-1 text-xs text-accent">Калькулятор НДФЛ →</div>
          </Link>
          <Link
            href="/alimenty"
            className="rounded-xl border border-border p-3 transition-colors hover:border-accent hover:bg-accent-soft"
          >
            <div className="text-xs text-muted">Алименты на 1 ребёнка</div>
            <div className="mt-1 text-lg font-semibold">{formatCurrency(alimonyOneChild)}</div>
            <div className="mt-1 text-xs text-accent">Калькулятор алиментов →</div>
          </Link>
          <Link
            href="/detskie-vychety"
            className="rounded-xl border border-border p-3 transition-colors hover:border-accent hover:bg-accent-soft"
          >
            <div className="text-xs text-muted">Экономия на вычете (1 ребёнок)</div>
            <div className="mt-1 text-lg font-semibold">{formatCurrency(deductionSavings)}</div>
            <div className="mt-1 text-xs text-accent">Калькулятор вычетов →</div>
          </Link>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        Ориентировочный расчёт для одного ребёнка без доп. условий - точные цифры для вашей ситуации
        даст сам калькулятор по ссылке. Зарплата запоминается в браузере и подставляется в других
        калькуляторах сайта - это можно отключить прямо там.
      </p>
    </div>
  );
}
