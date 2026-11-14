"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
} from "@/components/Calculator";
import { AlimentyWhatIfSlider } from "@/components/calculators/AlimentyWhatIfSlider";
import { ALIMONY_SHARE, calculateAlimony, type ChildrenCount } from "@/lib/calculators/alimenty";
import { calculateAnnualNdfl } from "@/lib/calculators/ndfl";
import { formatCurrency } from "@/lib/format";

const SHARE_LABEL: Record<ChildrenCount, string> = {
  one: "1/4 (25%)",
  two: "1/3 (≈33%)",
  threeOrMore: "1/2 (50%)",
};

/** Пошаговый разбор того же расчёта, что и в calculate() - для блока "Показать расчёт по шагам". */
function buildBreakdown(income: number, childrenCount: ChildrenCount): BreakdownStep[] {
  const annualGross = income * 12;
  const { segments, totalTax, netAnnualIncome } = calculateAnnualNdfl(annualGross);
  const monthlyNetIncome = netAnnualIncome / 12;
  const taxedSegments = segments.filter((segment) => segment.taxableAmount > 0);

  const steps: BreakdownStep[] = [
    {
      label: "Доход за год до вычета НДФЛ",
      formula: `${formatCurrency(income)} × 12`,
      result: formatCurrency(annualGross),
    },
  ];

  for (const segment of taxedSegments) {
    steps.push({
      label:
        taxedSegments.length > 1
          ? `НДФЛ ${segment.rate * 100}% с суммы от ${formatCurrency(segment.from)}`
          : `НДФЛ ${segment.rate * 100}%`,
      formula: `${formatCurrency(segment.taxableAmount)} × ${segment.rate * 100}%`,
      result: formatCurrency(segment.tax),
      lawLabel: "ст. 224 НК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/nk/st-224",
    });
  }

  steps.push({
    label: "Доход после НДФЛ, в месяц",
    formula: `(${formatCurrency(annualGross)} − ${formatCurrency(totalTax)}) / 12`,
    result: formatCurrency(monthlyNetIncome),
    note: "Алименты считаются от дохода уже после налога, а не до него",
  });

  steps.push({
    label: `Алименты, доля ${SHARE_LABEL[childrenCount]}`,
    formula: `${formatCurrency(monthlyNetIncome)} × ${Math.round(ALIMONY_SHARE[childrenCount] * 100)}%`,
    result: formatCurrency(monthlyNetIncome * ALIMONY_SHARE[childrenCount]),
    lawLabel: "ст. 81 СК РФ",
    lawHref: "https://pravo.ppt.ru/kodeks/sk/st-81",
  });

  return steps;
}

function calculate(values: CalculatorValues): CalculationResult {
  const income = Number(values.income);
  const childrenCount = values.childrenCount as ChildrenCount;

  if (income <= 0) return { ok: false, error: "Доход должен быть больше нуля" };

  const { monthlyNetIncome, alimony } = calculateAlimony(income, childrenCount);

  return {
    ok: true,
    lines: [
      {
        label: "Доход после вычета НДФЛ",
        value: formatCurrency(monthlyNetIncome),
        hint: "Алименты считаются от дохода уже после налога, а не до него",
      },
      { label: "Доля алиментов", value: SHARE_LABEL[childrenCount] },
      { label: "Алименты в месяц", value: formatCurrency(alimony), emphasis: true },
    ],
    breakdown: buildBreakdown(income, childrenCount),
  };
}

const CHILDREN_COUNT_TO_PROFILE: Record<ChildrenCount, number> = { one: 1, two: 2, threeOrMore: 3 };

function childrenCountFromProfile(value: number): ChildrenCount {
  if (value <= 1) return "one";
  if (value === 2) return "two";
  return "threeOrMore";
}

export function AlimentyCalculatorForm() {
  return (
    <>
      <Calculator
        resultCardTitle="Алименты"
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
            toProfile: (value) => CHILDREN_COUNT_TO_PROFILE[value as ChildrenCount],
            fromProfile: (value) => childrenCountFromProfile(value),
          },
        ]}
        fields={[
          {
            id: "income",
            type: "number",
            label: "Доход плательщика за месяц (до вычета НДФЛ)",
            unit: "₽",
            min: 0,
            placeholder: "Например, 96000",
          },
          {
            id: "childrenCount",
            type: "radio",
            label: "Количество детей",
            options: [
              { value: "one", label: "1 ребёнок" },
              { value: "two", label: "2 детей" },
              { value: "threeOrMore", label: "3 и более" },
            ],
            defaultValue: "one",
          },
        ]}
        calculate={calculate}
      />
      <AlimentyWhatIfSlider />
    </>
  );
}
