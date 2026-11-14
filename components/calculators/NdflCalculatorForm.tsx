"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
  type ResultLine,
} from "@/components/Calculator";
import { NdflWhatIfSlider } from "@/components/calculators/NdflWhatIfSlider";
import { calculateAnnualNdfl, type NdflCalculation } from "@/lib/calculators/ndfl";
import { formatCurrency } from "@/lib/format";

/** Пошаговый разбор того же расчёта, что и в calculate() - для блока "Показать расчёт по шагам". */
function buildBreakdown(
  income: number,
  period: "month" | "year",
  annualIncome: number,
  ndfl: NdflCalculation,
): BreakdownStep[] {
  const steps: BreakdownStep[] = [];

  if (period === "month") {
    steps.push({
      label: "Доход за год",
      formula: `${formatCurrency(income)} × 12`,
      result: formatCurrency(annualIncome),
    });
  }

  for (const segment of ndfl.segments) {
    if (segment.taxableAmount <= 0) continue;
    steps.push({
      label:
        ndfl.segments.length > 1
          ? `НДФЛ ${segment.rate * 100}% с суммы от ${formatCurrency(segment.from)}`
          : `НДФЛ ${segment.rate * 100}%`,
      formula: `${formatCurrency(segment.taxableAmount)} × ${segment.rate * 100}%`,
      result: formatCurrency(segment.tax),
      lawLabel: "ст. 224 НК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/nk/st-224",
    });
  }

  steps.push({
    label: "Доход на руки",
    formula: `${formatCurrency(annualIncome)} − ${formatCurrency(ndfl.totalTax)}`,
    result: formatCurrency(ndfl.netAnnualIncome),
  });

  return steps;
}

function calculate(values: CalculatorValues): CalculationResult {
  const income = Number(values.income);
  const period = values.period as "month" | "year";

  if (!Number.isFinite(income) || income < 0) {
    return { ok: false, error: "Введите доход неотрицательным числом" };
  }

  const annualIncome = period === "month" ? income * 12 : income;
  const ndflResult = calculateAnnualNdfl(annualIncome);
  const { segments, totalTax, netAnnualIncome } = ndflResult;
  const divisor = period === "month" ? 12 : 1;
  const periodLabel = period === "month" ? "в месяц" : "за год";

  const lines: ResultLine[] = [];

  if (period === "month") {
    lines.push({
      label: "Доход за год",
      value: formatCurrency(annualIncome),
      hint: "Доход × 12 - прогрессивная шкала НДФЛ считается по годовой сумме",
    });
  }

  if (segments.length <= 1) {
    lines.push({ label: "Ставка НДФЛ", value: `${(segments[0]?.rate ?? 0.13) * 100}%` });
  } else {
    for (const segment of segments) {
      lines.push({
        label: `НДФЛ по ставке ${segment.rate * 100}%`,
        value: formatCurrency(segment.tax),
        hint: `с дохода от ${formatCurrency(segment.from)} до ${
          Number.isFinite(segment.to) ? formatCurrency(segment.to) : "…"
        } в год`,
      });
    }
  }

  lines.push({ label: `НДФЛ ${periodLabel}`, value: formatCurrency(totalTax / divisor) });
  lines.push({
    label: `На руки ${periodLabel}`,
    value: formatCurrency(netAnnualIncome / divisor),
    emphasis: true,
  });

  const compareRaw = values.compareIncome;
  const compareIncome = compareRaw === "" || compareRaw === undefined ? null : Number(compareRaw);
  if (compareIncome !== null && Number.isFinite(compareIncome) && compareIncome > 0) {
    const compareAnnualIncome = period === "month" ? compareIncome * 12 : compareIncome;
    const compareResult = calculateAnnualNdfl(compareAnnualIncome);
    const netNow = netAnnualIncome / divisor;
    const netCompare = compareResult.netAnnualIncome / divisor;
    const diff = netCompare - netNow;
    const sign = diff >= 0 ? "+" : "−";

    lines.push({
      label: `На руки ${periodLabel} при доходе ${formatCurrency(compareIncome)}`,
      value: formatCurrency(netCompare),
      hint: "Для сравнения - например, при повышении оклада",
    });
    const currentTopRate = segments[segments.length - 1]?.rate ?? 0;
    const compareTopRate = compareResult.segments[compareResult.segments.length - 1]?.rate ?? 0;

    lines.push({
      label: "Разница на руки",
      value: `${sign}${formatCurrency(Math.abs(diff))}`,
      hint:
        compareTopRate > currentTopRate
          ? "Часть роста уйдёт в более высокую ставку НДФЛ - доход переходит в следующий порог"
          : undefined,
    });
  }

  return { ok: true, lines, breakdown: buildBreakdown(income, period, annualIncome, ndflResult) };
}

export function NdflCalculatorForm() {
  return (
    <>
      <Calculator
        resultCardTitle="НДФЛ"
        profileSync={[
          // Только чтение: поле "доход" здесь означает и месяц, и год в зависимости от
          // переключателя периода, поэтому писать его обратно в профиль было бы неоднозначно.
          { fieldId: "income", profileKey: "monthlyIncome", fromProfile: (v) => v },
        ]}
        fields={[
          {
            id: "income",
            type: "number",
            label: "Доход до вычета налога",
            unit: "₽",
            min: 0,
            placeholder: "Например, 150000",
          },
          {
            id: "period",
            type: "radio",
            label: "Период",
            options: [
              { value: "month", label: "За месяц" },
              { value: "year", label: "За год" },
            ],
            defaultValue: "month",
          },
          {
            id: "compareIncome",
            type: "number",
            label: "Сравнить с доходом (необязательно)",
            hint: "Например, при повышении оклада - в тех же единицах (месяц/год), что и доход выше",
            unit: "₽",
            min: 0,
            required: false,
            placeholder: "Например, 180000",
          },
        ]}
        calculate={calculate}
      />
      <NdflWhatIfSlider />
    </>
  );
}
