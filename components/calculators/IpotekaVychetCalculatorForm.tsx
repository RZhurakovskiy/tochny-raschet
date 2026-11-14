"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
  type ResultLine,
} from "@/components/Calculator";
import { calculateDeductionSplit, type SpouseDeductionResult } from "@/lib/calculators/ipoteka";
import { MORTGAGE_INTEREST_DEDUCTION_LIMIT } from "@/lib/calculators/constants";
import { formatCurrency } from "@/lib/format";

function spouseLines(label: string, spouse: SpouseDeductionResult): ResultLine[] {
  const lines: ResultLine[] = [
    {
      label: `${label} - доля процентов`,
      value: formatCurrency(spouse.interestShare),
    },
  ];
  if (spouse.wastedInterest > 0) {
    lines.push({
      label: `${label} - не попадёт под вычет`,
      value: formatCurrency(spouse.wastedInterest),
      hint: `Лимит вычета на человека - ${formatCurrency(MORTGAGE_INTEREST_DEDUCTION_LIMIT)}, остальное вычетом не покрывается`,
    });
  }
  lines.push(
    {
      label: `${label} - вернёт всего`,
      value: formatCurrency(spouse.totalRefund),
    },
    {
      label: `${label} - за сколько лет`,
      value: spouse.years > 0 ? `${spouse.years} г.` : "-",
    },
  );
  return lines;
}

function spouseBreakdown(label: string, spouse: SpouseDeductionResult): BreakdownStep[] {
  const steps: BreakdownStep[] = [
    {
      label: `${label}: доля процентов под вычет`,
      formula:
        spouse.wastedInterest > 0
          ? `min(${formatCurrency(spouse.interestShare)}, ${formatCurrency(MORTGAGE_INTEREST_DEDUCTION_LIMIT)})`
          : undefined,
      result: formatCurrency(spouse.claimableInterest),
      note:
        spouse.wastedInterest > 0
          ? `${formatCurrency(spouse.wastedInterest)} сверх лимита вычетом не покрывается`
          : undefined,
      lawLabel: "п. 4 ст. 220 НК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/nk/st-220",
    },
    {
      label: `${label}: вернётся всего`,
      result: `${formatCurrency(spouse.totalRefund)} за ${spouse.years} г.`,
      note: "Каждый год заявляется вычет на весь годовой доход, пока не выберется вся сумма - реальный возврат считается по прогрессивной шкале НДФЛ, а не плоскими 13%",
    },
  ];
  return steps;
}

function calculate(values: CalculatorValues): CalculationResult {
  const totalInterest = Number(values.totalInterest);
  const incomeAMonthly = Number(values.incomeAMonthly);
  const incomeBMonthly = Number(values.incomeBMonthly);
  const splitPercentA = Number(values.splitPercentA);

  if (totalInterest <= 0) {
    return { ok: false, error: "Сумма процентов должна быть больше нуля" };
  }
  if (incomeAMonthly <= 0 || incomeBMonthly <= 0) {
    return { ok: false, error: "Доход каждого супруга должен быть больше нуля" };
  }

  const { spouseA, spouseB } = calculateDeductionSplit(
    totalInterest,
    splitPercentA,
    incomeAMonthly * 12,
    incomeBMonthly * 12,
  );

  const totalRefund = spouseA.totalRefund + spouseB.totalRefund;

  return {
    ok: true,
    lines: [
      ...spouseLines("Супруг А", spouseA),
      ...spouseLines("Супруг Б", spouseB),
      { label: "Итого вернёт семья", value: formatCurrency(totalRefund), emphasis: true },
    ],
    breakdown: [...spouseBreakdown("Супруг А", spouseA), ...spouseBreakdown("Супруг Б", spouseB)],
  };
}

export function IpotekaVychetCalculatorForm() {
  return (
    <Calculator
      resultCardTitle="Раздел вычета по ипотеке"
      historyId="vychet"
      fields={[
        {
          id: "totalInterest",
          type: "number",
          label: "Проценты по ипотеке (уплаченные и будущие)",
          unit: "₽",
          min: 0,
          placeholder: "Например, 4000000",
          hint: "Можно взять из расчёта выше («Переплата по процентам») или из справки банка",
          fullWidth: true,
        },
        {
          id: "incomeAMonthly",
          type: "number",
          label: "Доход супруга А в месяц (до вычета НДФЛ)",
          unit: "₽",
          min: 0,
          placeholder: "Например, 150000",
        },
        {
          id: "incomeBMonthly",
          type: "number",
          label: "Доход супруга Б в месяц (до вычета НДФЛ)",
          unit: "₽",
          min: 0,
          placeholder: "Например, 80000",
        },
        {
          id: "splitPercentA",
          type: "number",
          label: "Доля супруга А в вычете",
          unit: "%",
          min: 0,
          max: 100,
          defaultValue: 50,
          hint: "Можно распределить как угодно по совместному заявлению - и менять пропорцию при каждом следующем обращении в ФНС",
        },
      ]}
      calculate={calculate}
    />
  );
}
