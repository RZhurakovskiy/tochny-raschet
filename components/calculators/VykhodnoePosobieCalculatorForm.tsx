"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
} from "@/components/Calculator";
import { VykhodnoePosobieWhatIfSlider } from "@/components/calculators/VykhodnoePosobieWhatIfSlider";
import { calculateSeveranceBenefit } from "@/lib/calculators/vykhodnoe-posobie";
import { formatCurrency } from "@/lib/format";

/** Пошаговый разбор того же расчёта, что и в calculate() - для блока "Показать расчёт по шагам". */
function buildBreakdown(
  income12Months: number,
  avgMonthlyIncome: number,
  monthsPaid: number,
  benefit: number,
): BreakdownStep[] {
  return [
    {
      label: "Средний месячный заработок",
      formula: `${formatCurrency(income12Months)} / 12`,
      result: formatCurrency(avgMonthlyIncome),
    },
    {
      label: `Пособие за ${monthsPaid} мес.`,
      formula: `${formatCurrency(avgMonthlyIncome)} × ${monthsPaid}`,
      result: formatCurrency(benefit),
      note: "НДФЛ не удерживается - в пределах трёхкратного среднего заработка (ст. 217 НК РФ)",
      lawLabel: "ст. 178 ТК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/tk/st-178",
    },
  ];
}

function calculate(values: CalculatorValues): CalculationResult {
  const income12Months = Number(values.income12Months);
  const month2Paid = Boolean(values.month2Paid);
  const month3Paid = Boolean(values.month3Paid);

  if (income12Months <= 0) return { ok: false, error: "Доход должен быть больше нуля" };
  if (month3Paid && !month2Paid) {
    return {
      ok: false,
      error:
        "Выплата за 3-й месяц возможна, только если вы также не были трудоустроены во 2-й месяц - отметьте оба условия",
    };
  }

  const { avgMonthlyIncome, monthsPaid, benefit } = calculateSeveranceBenefit(
    income12Months,
    month2Paid,
    month3Paid,
  );

  return {
    ok: true,
    lines: [
      {
        label: "Средний месячный заработок",
        value: formatCurrency(avgMonthlyIncome),
        hint: "Упрощённо: доход за 12 месяцев / 12",
      },
      { label: "Пособие за 1-й месяц", value: formatCurrency(avgMonthlyIncome) },
      ...(month2Paid
        ? [{ label: "Средний заработок за 2-й месяц", value: formatCurrency(avgMonthlyIncome) }]
        : []),
      ...(month3Paid
        ? [{ label: "Средний заработок за 3-й месяц", value: formatCurrency(avgMonthlyIncome) }]
        : []),
      {
        label: `Итого за ${monthsPaid} мес.`,
        value: formatCurrency(benefit),
        hint: "НДФЛ не удерживается - в пределах трёхкратного среднего месячного заработка выплаты при увольнении освобождены от налога (ст. 217 НК РФ)",
        emphasis: true,
      },
    ],
    breakdown: buildBreakdown(income12Months, avgMonthlyIncome, monthsPaid, benefit),
  };
}

export function VykhodnoePosobieCalculatorForm() {
  return (
    <>
      <Calculator
        resultCardTitle="Выходное пособие"
        profileSync={[
          {
            fieldId: "income12Months",
            profileKey: "monthlyIncome",
            toProfile: (value) => Number(value) / 12,
            fromProfile: (value) => Math.round(value * 12),
          },
        ]}
        fields={[
          {
            id: "income12Months",
            type: "number",
            label: "Доход за последние 12 месяцев",
            unit: "₽",
            min: 0,
            placeholder: "Например, 960000",
            hint: "Для упрощённого расчёта среднего месячного заработка",
          },
          {
            id: "month2Paid",
            type: "checkbox",
            label: "Не трудоустроен(а) в течение 2-го месяца после увольнения",
          },
          {
            id: "month3Paid",
            type: "checkbox",
            label: "Служба занятости приняла решение о выплате за 3-й месяц",
            hint: "Возможно, только если вы встали на учёт в течение 14 рабочих дней после увольнения и не трудоустроились за 2 месяца",
          },
        ]}
        calculate={calculate}
      />
      <VykhodnoePosobieWhatIfSlider />
    </>
  );
}
