"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
} from "@/components/Calculator";
import { IpotekaExtraPaymentSlider } from "@/components/calculators/IpotekaExtraPaymentSlider";
import { calculateMortgageBase, type MortgageBaseCalculation } from "@/lib/calculators/ipoteka";
import { formatCurrency } from "@/lib/format";

/** Пошаговый разбор того же расчёта, что и в calculate() - для блока "Показать расчёт по шагам". */
function buildBreakdown(
  remainingBalance: number,
  annualRatePercent: number,
  remainingMonths: number,
  result: MortgageBaseCalculation,
): BreakdownStep[] {
  const { monthlyPayment, totalPaid, totalInterest } = result;
  const monthlyRatePercent = annualRatePercent / 12;

  return [
    {
      label: "Месячная ставка",
      formula: `${annualRatePercent}% / 12`,
      result: `${monthlyRatePercent.toFixed(3)}%`,
    },
    {
      label: "Ежемесячный платёж",
      formula: `${formatCurrency(remainingBalance)} × месячная ставка / (1 − (1 + месячная ставка)⁻ⁿ)`,
      result: formatCurrency(monthlyPayment),
      note: `n = ${remainingMonths} мес. - формула аннуитетного платежа`,
    },
    {
      label: "Всего будет выплачено",
      formula: `${formatCurrency(monthlyPayment)} × ${remainingMonths} мес.`,
      result: formatCurrency(totalPaid),
    },
    {
      label: "Переплата по процентам",
      formula: `${formatCurrency(totalPaid)} − ${formatCurrency(remainingBalance)}`,
      result: formatCurrency(totalInterest),
    },
  ];
}

function calculate(values: CalculatorValues): CalculationResult {
  const remainingBalance = Number(values.remainingBalance);
  const annualRatePercent = Number(values.annualRatePercent);
  const remainingMonths = Number(values.remainingMonths);

  if (remainingBalance <= 0) return { ok: false, error: "Остаток долга должен быть больше нуля" };
  if (annualRatePercent <= 0) return { ok: false, error: "Ставка должна быть больше нуля" };
  if (remainingMonths <= 0) {
    return { ok: false, error: "Оставшийся срок должен быть больше нуля" };
  }

  const result = calculateMortgageBase(remainingBalance, annualRatePercent, remainingMonths);

  return {
    ok: true,
    lines: [
      { label: "Ежемесячный платёж", value: formatCurrency(result.monthlyPayment), emphasis: true },
      { label: "Всего будет выплачено", value: formatCurrency(result.totalPaid) },
      { label: "Переплата по процентам", value: formatCurrency(result.totalInterest) },
      {
        label: "В ближайшем платеже сейчас",
        value: `${formatCurrency(result.currentInterestPart)} - проценты, ${formatCurrency(result.currentPrincipalPart)} - долг`,
        hint: "Со временем доля процентов в платеже уменьшается, а доля основного долга растёт",
      },
    ],
    breakdown: buildBreakdown(remainingBalance, annualRatePercent, remainingMonths, result),
  };
}

export function IpotekaCalculatorForm() {
  return (
    <>
      <Calculator
        resultCardTitle="Ипотека"
        historyId="baza"
        fields={[
          {
            id: "remainingBalance",
            type: "number",
            label: "Остаток долга по ипотеке",
            unit: "₽",
            min: 0,
            placeholder: "Например, 5000000",
            hint: "Текущий остаток, не первоначальная сумма кредита - смотрите в приложении банка",
          },
          {
            id: "annualRatePercent",
            type: "number",
            label: "Процентная ставка",
            unit: "% годовых",
            min: 0,
            max: 50,
            step: 0.1,
            placeholder: "Например, 18",
          },
          {
            id: "remainingMonths",
            type: "number",
            label: "Оставшийся срок",
            unit: "мес.",
            min: 1,
            max: 480,
            placeholder: "Например, 180 (15 лет)",
          },
        ]}
        calculate={calculate}
      />
      <IpotekaExtraPaymentSlider />
    </>
  );
}
