"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
} from "@/components/Calculator";
import {
  calculateVacationCompensation,
  VACATION_DAYS_PER_MONTH,
} from "@/lib/calculators/kompensaciya-otpuska";
import { formatCurrency, formatNumber } from "@/lib/format";

const FLAT_NDFL_RATE = 0.13;

/** Пошаговый разбор того же расчёта, что и в calculate() - для блока "Показать расчёт по шагам". */
function buildBreakdown(
  fullMonths: number,
  usedDays: number,
  days: number,
  sdz: number,
  gross: number,
): BreakdownStep[] {
  const ndfl = gross * FLAT_NDFL_RATE;
  const net = gross - ndfl;
  return [
    {
      label: "Дней компенсации",
      formula: `${VACATION_DAYS_PER_MONTH.toFixed(2)} × ${fullMonths} мес. − ${formatNumber(usedDays)} исп. дн.`,
      result: `${formatNumber(days)} дн.`,
      lawLabel: "ст. 127 ТК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/tk/st-127",
    },
    { label: "Среднедневной заработок", result: formatCurrency(sdz) },
    {
      label: "Компенсация до вычета НДФЛ",
      formula: `${formatCurrency(sdz)} × ${formatNumber(days)} дн.`,
      result: formatCurrency(gross),
    },
    {
      label: "НДФЛ 13%",
      formula: `${formatCurrency(gross)} × 13%`,
      result: formatCurrency(ndfl),
      lawLabel: "ст. 224 НК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/nk/st-224",
    },
    {
      label: "Компенсация на руки",
      formula: `${formatCurrency(gross)} − ${formatCurrency(ndfl)}`,
      result: formatCurrency(net),
    },
  ];
}

function calculate(values: CalculatorValues): CalculationResult {
  const income = Number(values.income);
  const fullMonths = Number(values.fullMonths);
  const usedDays = Number(values.usedDays);

  if (income <= 0) return { ok: false, error: "Доход должен быть больше нуля" };

  const { sdz, days, gross } = calculateVacationCompensation(income, fullMonths, usedDays);

  if (days === 0) {
    return {
      ok: true,
      lines: [
        {
          label: "Дней компенсации",
          value: "0",
          hint: "Использованные дни отпуска покрывают или превышают заработанные - компенсация не положена",
        },
      ],
    };
  }

  const ndfl = gross * FLAT_NDFL_RATE;
  const net = gross - ndfl;

  return {
    ok: true,
    lines: [
      {
        label: "Дней компенсации",
        value: `${formatNumber(days)} дн.`,
        hint: "Если в компании принято округлять - только в бо́льшую сторону, в пользу работника",
      },
      { label: "Среднедневной заработок", value: formatCurrency(sdz) },
      { label: "Компенсация (до вычета НДФЛ)", value: formatCurrency(gross) },
      {
        label: "НДФЛ (13%)",
        value: formatCurrency(ndfl),
        hint: "При годовом доходе свыше 2 400 000 ₽ ставка может быть выше - см. калькулятор НДФЛ",
      },
      { label: "Компенсация на руки", value: formatCurrency(net), emphasis: true },
    ],
    breakdown: buildBreakdown(fullMonths, usedDays, days, sdz, gross),
  };
}

export function KompensaciyaOtpuskaCalculatorForm() {
  return (
    <Calculator
      resultCardTitle="Компенсация за отпуск"
      profileSync={[
        {
          fieldId: "income",
          profileKey: "monthlyIncome",
          toProfile: (value) => Number(value) / 12,
          fromProfile: (value) => Math.round(value * 12),
        },
      ]}
      fields={[
        {
          id: "income",
          type: "number",
          label: "Доход за последние 12 месяцев",
          unit: "₽",
          min: 0,
          placeholder: "Например, 960000",
        },
        {
          id: "fullMonths",
          type: "number",
          label: "Полных отработанных месяцев с момента трудоустройства",
          min: 0,
          max: 600,
          placeholder: "Например, 7",
          hint: "Не только за последний год - если отпуск не брали несколько лет подряд, укажите общее число месяцев за весь этот период. Месяц считается полным при 15 и более отработанных днях, иначе не учитывается",
        },
        {
          id: "usedDays",
          type: "number",
          label: "Всего использовано дней отпуска за весь этот период",
          unit: "дней",
          min: 0,
          max: 3650,
          defaultValue: 0,
        },
      ]}
      calculate={calculate}
    />
  );
}
