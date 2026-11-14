"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
  type ResultLine,
} from "@/components/Calculator";
import { BolnichnyyWhatIfSlider } from "@/components/calculators/BolnichnyyWhatIfSlider";
import { calculateSickLeaveBenefit, type SickLeaveCalculation } from "@/lib/calculators/bolnichnyy";
import { formatCurrency } from "@/lib/format";

const FLAT_NDFL_RATE = 0.13;
const SDZ_LAW_HREF =
  "https://www.consultant.ru/document/cons_doc_LAW_64871/577325721f414027e15ab7d9aac146e82cffa46f/";

/** Пошаговый разбор того же расчёта, что и в calculate() - для блока "Показать расчёт по шагам". */
function buildBreakdown(
  income2Years: number,
  days: number,
  result: SickLeaveCalculation,
): BreakdownStep[] {
  const { rawSdz, sdz, cappedByMax, raisedToMin, rate, benefit } = result;
  const ndfl = benefit * FLAT_NDFL_RATE;
  const net = benefit - ndfl;

  const steps: BreakdownStep[] = [
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
      label: "Пособие до вычета НДФЛ",
      formula: `${formatCurrency(sdz)} × ${rate * 100}% × ${days} дн.`,
      result: formatCurrency(benefit),
    },
    {
      label: "НДФЛ 13%",
      formula: `${formatCurrency(benefit)} × 13%`,
      result: formatCurrency(ndfl),
      lawLabel: "ст. 224 НК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/nk/st-224",
    },
    {
      label: "Пособие на руки",
      formula: `${formatCurrency(benefit)} − ${formatCurrency(ndfl)}`,
      result: formatCurrency(net),
    },
  ];

  return steps;
}

function calculate(values: CalculatorValues): CalculationResult {
  const income2Years = Number(values.income2Years);
  const insuranceYears = Number(values.insuranceYears);
  const days = Number(values.days);

  if (income2Years < 0) return { ok: false, error: "Доход не может быть отрицательным" };
  if (days <= 0) return { ok: false, error: "Количество дней больничного должно быть больше нуля" };

  const sickLeaveResult = calculateSickLeaveBenefit(income2Years, insuranceYears, days);
  const { rawSdz, sdz, cappedByMax, raisedToMin, rate, benefit } = sickLeaveResult;

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

  lines.push({ label: "Процент оплаты по стажу", value: `${rate * 100}%` });

  const ndfl = benefit * FLAT_NDFL_RATE;
  const net = benefit - ndfl;

  lines.push({ label: "Пособие (до вычета НДФЛ)", value: formatCurrency(benefit) });
  lines.push({ label: "НДФЛ (13%)", value: formatCurrency(ndfl) });
  lines.push({ label: "Пособие на руки", value: formatCurrency(net), emphasis: true });

  return { ok: true, lines, breakdown: buildBreakdown(income2Years, days, sickLeaveResult) };
}

export function BolnichnyyCalculatorForm() {
  return (
    <>
      <Calculator
        resultCardTitle="Больничный"
        profileSync={[
          {
            fieldId: "income2Years",
            profileKey: "monthlyIncome",
            toProfile: (value) => Number(value) / 24,
            fromProfile: (value) => Math.round(value * 24),
          },
          {
            fieldId: "insuranceYears",
            profileKey: "insuranceYears",
            toProfile: (v) => Number(v),
            fromProfile: (v) => v,
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
            hint: "Суммарный доход за 2 календарных года, предшествующих году болезни, с которого платились взносы",
          },
          {
            id: "insuranceYears",
            type: "number",
            label: "Страховой стаж",
            unit: "лет",
            min: 0,
            max: 80,
            placeholder: "Например, 6",
          },
          {
            id: "days",
            type: "number",
            label: "Количество дней больничного",
            unit: "дней",
            min: 1,
            max: 365,
            placeholder: "Например, 7",
          },
        ]}
        calculate={calculate}
      />
      <BolnichnyyWhatIfSlider />
    </>
  );
}
