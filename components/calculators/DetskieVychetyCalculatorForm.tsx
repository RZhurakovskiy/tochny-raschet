"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
} from "@/components/Calculator";
import {
  calculateChildDeductionSavings,
  type ChildDeductionCalculation,
} from "@/lib/calculators/detskie-vychety";
import { CHILD_DEDUCTION_2026 } from "@/lib/calculators/constants";
import { DetskieVychetyWhatIfSlider } from "@/components/calculators/DetskieVychetyWhatIfSlider";
import { formatCurrency } from "@/lib/format";

function perChildDeductionAmount(position: number): number {
  if (position === 1) return CHILD_DEDUCTION_2026.first;
  if (position === 2) return CHILD_DEDUCTION_2026.second;
  return CHILD_DEDUCTION_2026.thirdAndNext;
}

/** Пошаговый разбор того же расчёта, что и в calculate() - для блока "Показать расчёт по шагам". */
function buildBreakdown(
  income: number,
  childrenCount: number,
  disabledChildrenCount: number,
  doubleDeduction: boolean,
  result: ChildDeductionCalculation,
): BreakdownStep[] {
  const {
    monthlyDeduction,
    monthsWithDeduction,
    annualDeductionTotal,
    annualSavings,
    taxWithoutDeduction,
    taxWithDeduction,
  } = result;

  const perChildParts = Array.from({ length: childrenCount }, (_, i) =>
    formatCurrency(perChildDeductionAmount(i + 1)),
  );
  const formulaParts = [...perChildParts];
  if (disabledChildrenCount > 0) {
    formulaParts.push(
      `${disabledChildrenCount} × ${formatCurrency(CHILD_DEDUCTION_2026.disabled)}`,
    );
  }

  return [
    {
      label: "Сумма вычета в месяц",
      formula: doubleDeduction ? `(${formulaParts.join(" + ")}) × 2` : formulaParts.join(" + "),
      result: formatCurrency(monthlyDeduction),
      lawLabel: "ст. 218 НК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/nk/st-218",
    },
    {
      label: "Месяцев действия вычета в году",
      result: `${monthsWithDeduction} мес.`,
      note: `Доход нарастающим итогом переходит порог 450 000 ₽ - вычет применяется, пока накопленный доход его не превысил`,
    },
    {
      label: "Вычет за год",
      formula: `${formatCurrency(monthlyDeduction)} × ${monthsWithDeduction} мес.`,
      result: formatCurrency(annualDeductionTotal),
    },
    {
      label: "НДФЛ за год без вычета",
      result: formatCurrency(taxWithoutDeduction),
    },
    {
      label: "НДФЛ за год с вычетом",
      formula: `НДФЛ от (${formatCurrency(income * 12)} − ${formatCurrency(annualDeductionTotal)})`,
      result: formatCurrency(taxWithDeduction),
    },
    {
      label: "Экономия по НДФЛ за год",
      formula: `${formatCurrency(taxWithoutDeduction)} − ${formatCurrency(taxWithDeduction)}`,
      result: formatCurrency(annualSavings),
    },
  ];
}

function calculate(values: CalculatorValues): CalculationResult {
  const income = Number(values.income);
  const childrenCount = Number(values.childrenCount);
  const disabledChildrenCount = Number(values.disabledChildrenCount);
  const doubleDeduction = Boolean(values.doubleDeduction);

  if (income <= 0) return { ok: false, error: "Доход должен быть больше нуля" };
  if (disabledChildrenCount > childrenCount) {
    return { ok: false, error: "Детей-инвалидов не может быть больше общего числа детей" };
  }

  const deductionResult = calculateChildDeductionSavings(
    income,
    childrenCount,
    disabledChildrenCount,
    doubleDeduction,
  );
  const { monthlyDeduction, monthsWithDeduction, annualSavings, avgMonthlySavings } =
    deductionResult;

  if (monthsWithDeduction === 0) {
    return {
      ok: true,
      lines: [
        {
          label: "Вычет не действует",
          value: "0 ₽",
          hint: "Доход нарастающим итогом превышает порог 450 000 ₽ уже в первый месяц года",
        },
      ],
    };
  }

  return {
    ok: true,
    lines: [
      { label: "Сумма вычета в месяц", value: formatCurrency(monthlyDeduction) },
      {
        label: "Вычет действует",
        value: `${monthsWithDeduction} мес. в году`,
        hint: "До месяца, в котором доход нарастающим итогом превысит 450 000 ₽",
      },
      { label: "Экономия по НДФЛ за год", value: formatCurrency(annualSavings) },
      {
        label: "Экономия по НДФЛ в среднем за месяц",
        value: formatCurrency(avgMonthlySavings),
        emphasis: true,
      },
    ],
    breakdown: buildBreakdown(
      income,
      childrenCount,
      disabledChildrenCount,
      doubleDeduction,
      deductionResult,
    ),
  };
}

export function DetskieVychetyCalculatorForm() {
  return (
    <>
      <Calculator
        resultCardTitle="Детские вычеты"
        profileSync={[
          {
            fieldId: "income",
            profileKey: "monthlyIncome",
            toProfile: (v) => Number(v),
            fromProfile: (v) => v,
          },
          {
            fieldId: "childrenCount",
            profileKey: "childrenCount",
            toProfile: (v) => Number(v),
            fromProfile: (v) => v,
          },
        ]}
        fields={[
          {
            id: "income",
            type: "number",
            label: "Доход в месяц (до вычета)",
            unit: "₽",
            min: 0,
            placeholder: "Например, 80000",
          },
          {
            id: "childrenCount",
            type: "number",
            label: "Количество детей",
            min: 1,
            max: 10,
            defaultValue: 1,
          },
          {
            id: "disabledChildrenCount",
            type: "number",
            label: "Из них детей-инвалидов",
            min: 0,
            max: 10,
            defaultValue: 0,
            hint: "Даёт дополнительно 12 000 ₽ к вычету на каждого такого ребёнка",
          },
          {
            id: "doubleDeduction",
            type: "checkbox",
            label:
              "Вычет в двойном размере (единственный родитель или отказ второго родителя в вашу пользу)",
          },
        ]}
        calculate={calculate}
      />
      <DetskieVychetyWhatIfSlider />
    </>
  );
}
