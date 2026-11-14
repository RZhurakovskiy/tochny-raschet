"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
  type ResultLine,
} from "@/components/Calculator";
import { DekretnyeWhatIfSlider } from "@/components/calculators/DekretnyeWhatIfSlider";
import { calculateMaternityBenefit, type MaternityLeaveType } from "@/lib/calculators/dekretnye";
import { formatCurrency } from "@/lib/format";

const SDZ_LAW_HREF =
  "https://www.consultant.ru/document/cons_doc_LAW_64871/577325721f414027e15ab7d9aac146e82cffa46f/";

/** Пошаговый разбор того же расчёта, что и в calculate() - для блока "Показать расчёт по шагам". */
function buildBreakdown(
  income2Years: number,
  rawSdz: number,
  sdz: number,
  cappedByMax: boolean,
  raisedToMin: boolean,
  days: number,
  benefit: number,
): BreakdownStep[] {
  return [
    {
      label: "Средний дневной заработок",
      formula: `${formatCurrency(income2Years)} / 730`,
      result: formatCurrency(rawSdz),
      note: cappedByMax
        ? `Выше максимума 2026 года - в расчёт идёт ${formatCurrency(sdz)}`
        : raisedToMin
          ? `Ниже минимума из МРОТ - в расчёт идёт ${formatCurrency(sdz)}`
          : undefined,
      lawLabel: "ст. 14 закона № 255-ФЗ",
      lawHref: SDZ_LAW_HREF,
    },
    {
      label: "Пособие к выплате",
      formula: `${formatCurrency(sdz)} × ${days} дн.`,
      result: formatCurrency(benefit),
      note: "Не облагается НДФЛ - начисленная сумма равна сумме к получению",
      lawLabel: "ст. 10 закона № 255-ФЗ",
    },
  ];
}

function calculate(values: CalculatorValues): CalculationResult {
  const income2Years = Number(values.income2Years);
  const leaveType = values.leaveType as MaternityLeaveType;

  if (income2Years < 0) return { ok: false, error: "Доход не может быть отрицательным" };

  const { rawSdz, sdz, cappedByMax, raisedToMin, days, benefit } = calculateMaternityBenefit(
    income2Years,
    leaveType,
  );

  const lines: ResultLine[] = [];

  if (cappedByMax) {
    lines.push({
      label: "Среднедневной заработок",
      value: formatCurrency(sdz),
      hint: `Расчётный СДЗ ${formatCurrency(rawSdz)} превышает максимум 2026 года - использован потолок`,
    });
  } else if (raisedToMin) {
    lines.push({
      label: "Среднедневной заработок",
      value: formatCurrency(sdz),
      hint: `Расчётный СДЗ ${formatCurrency(rawSdz)} ниже минимума из МРОТ - использован минимум 2026 года`,
    });
  } else {
    lines.push({ label: "Среднедневной заработок", value: formatCurrency(sdz) });
  }

  lines.push({ label: "Дней отпуска по БиР", value: `${days} дн.` });
  lines.push({
    label: "Пособие к выплате",
    value: formatCurrency(benefit),
    hint: "Не облагается НДФЛ - начисленная сумма равна сумме к получению",
    emphasis: true,
  });

  return {
    ok: true,
    lines,
    breakdown: buildBreakdown(income2Years, rawSdz, sdz, cappedByMax, raisedToMin, days, benefit),
  };
}

export function DekretnyeCalculatorForm() {
  return (
    <>
      <Calculator
        resultCardTitle="Декретные"
        profileSync={[
          {
            fieldId: "income2Years",
            profileKey: "monthlyIncome",
            toProfile: (value) => Number(value) / 24,
            fromProfile: (value) => Math.round(value * 24),
          },
        ]}
        fields={[
          {
            id: "income2Years",
            type: "number",
            label: "Доход за 2024 и 2025 годы",
            unit: "₽",
            min: 0,
            placeholder: "Например, 1800000",
            hint: "Суммарный доход за 2 календарных года, предшествующих году декрета, с которого платились взносы",
          },
          {
            id: "leaveType",
            type: "radio",
            label: "Тип родов",
            options: [
              { value: "standard", label: "Обычные - 140 дней" },
              { value: "complicated", label: "Осложнённые - 156 дней" },
              { value: "multiple", label: "Многоплодная беременность - 194 дня" },
            ],
            defaultValue: "standard",
          },
        ]}
        calculate={calculate}
      />
      <DekretnyeWhatIfSlider />
    </>
  );
}
