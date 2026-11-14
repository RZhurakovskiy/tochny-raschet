"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
  type ResultLine,
} from "@/components/Calculator";
import { OkladIzZarplatyWhatIfSlider } from "@/components/calculators/OkladIzZarplatyWhatIfSlider";
import {
  calculateGrossFromNet,
  type GrossFromNetCalculation,
} from "@/lib/calculators/oklad-iz-zarplaty";
import { formatCurrency } from "@/lib/format";

/** Пошаговый разбор того же расчёта, что и в calculate() - для блока "Показать расчёт по шагам". */
function buildBreakdown(result: GrossFromNetCalculation): BreakdownStep[] {
  const {
    targetNetAnnual,
    requiredGrossAnnual,
    marginalRate,
    bracketFromGross,
    netAtBracketStart,
  } = result;

  const steps: BreakdownStep[] = [
    {
      label: "Ставка НДФЛ на этом участке шкалы",
      result: `${marginalRate * 100}%`,
      note:
        bracketFromGross > 0
          ? `Часть оклада ниже ${formatCurrency(bracketFromGross)} облагается по более низким ставкам`
          : undefined,
      lawLabel: "ст. 224 НК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/nk/st-224",
    },
    {
      label: "Оклад до вычета налога",
      formula:
        bracketFromGross > 0
          ? `${formatCurrency(bracketFromGross)} + (${formatCurrency(targetNetAnnual)} − ${formatCurrency(netAtBracketStart)}) / (1 − ${marginalRate * 100}%)`
          : `${formatCurrency(targetNetAnnual)} / (1 − ${marginalRate * 100}%)`,
      result: formatCurrency(requiredGrossAnnual),
    },
  ];

  return steps;
}

function calculate(values: CalculatorValues): CalculationResult {
  const netIncome = Number(values.netIncome);
  const period = values.period as "month" | "year";

  if (!Number.isFinite(netIncome) || netIncome <= 0) {
    return { ok: false, error: "Введите сумму на руки больше нуля" };
  }

  const targetNetAnnual = period === "month" ? netIncome * 12 : netIncome;
  const grossResult = calculateGrossFromNet(targetNetAnnual);
  const { requiredGrossAnnual, totalTax, effectiveRate, marginalRate } = grossResult;
  const divisor = period === "month" ? 12 : 1;
  const periodLabel = period === "month" ? "в месяц" : "за год";

  const lines: ResultLine[] = [];

  if (period === "month") {
    lines.push({
      label: "На руки за год",
      value: formatCurrency(targetNetAnnual),
      hint: "Введённая сумма × 12 - прогрессивная шкала НДФЛ считается по годовому доходу",
    });
  }

  lines.push({
    label: `Нужный оклад ${periodLabel}`,
    value: formatCurrency(requiredGrossAnnual / divisor),
    hint: "Сумма до вычета НДФЛ - именно её стоит называть работодателю",
    emphasis: true,
  });
  lines.push({ label: `НДФЛ ${periodLabel}`, value: formatCurrency(totalTax / divisor) });
  lines.push({
    label: "Предельная ставка НДФЛ",
    value: `${Math.round(marginalRate * 1000) / 10}%`,
    hint: "Ставка на последний, самый верхний рубль оклада - по ней считается разница при изменении суммы",
  });
  lines.push({
    label: "Эффективная ставка НДФЛ",
    value: `${(effectiveRate * 100).toFixed(1)}%`,
    hint: "Отношение всего налога ко всему окладу - обычно ниже предельной ставки",
  });

  return { ok: true, lines, breakdown: buildBreakdown(grossResult) };
}

export function OkladIzZarplatyCalculatorForm() {
  return (
    <>
      <Calculator
        resultCardTitle="Оклад по зарплате на руки"
        fields={[
          {
            id: "netIncome",
            type: "number",
            label: "Желаемая сумма на руки",
            unit: "₽",
            min: 0,
            placeholder: "Например, 100000",
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
        ]}
        calculate={calculate}
      />
      <OkladIzZarplatyWhatIfSlider />
    </>
  );
}
