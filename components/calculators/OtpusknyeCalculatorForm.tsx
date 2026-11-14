"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
  type ResultLine,
} from "@/components/Calculator";
import {
  calculateVacationPay,
  calculateVacationPayWithIncompleteMonth,
} from "@/lib/calculators/otpusknye";
import type { CalendarReminder } from "@/components/Calculator";
import { addDays } from "@/lib/calculators/date-utils";
import { formatCurrency, formatNumber } from "@/lib/format";

const POSTANOVLENIE_540_HREF = "https://www.consultant.ru/document/cons_doc_LAW_504093/";

const FLAT_NDFL_RATE = 0.13;
const PAYOUT_DEADLINE_DAYS_BEFORE = 3;

const vacationStartDateField = {
  id: "vacationStartDate",
  type: "date" as const,
  label: "Дата начала отпуска (необязательно)",
  required: false,
  hint: "Заполните, чтобы получить напоминание в календарь о сроке выплаты отпускных",
};

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Напоминание "выплатить отпускные" - не позднее чем за 3 календарных дня до начала отпуска (ст. 136 ТК РФ). */
function buildCalendarReminder(
  vacationStartDate: string | undefined,
  net: number,
): CalendarReminder | undefined {
  if (!vacationStartDate) return undefined;
  const deadline = addDays(new Date(`${vacationStartDate}T00:00:00`), -PAYOUT_DEADLINE_DAYS_BEFORE);
  return {
    title: "Выплатить отпускные",
    description: `Не позднее 3 календарных дней до начала отпуска (ст. 136 ТК РФ) - на руки ${formatCurrency(net)}`,
    date: toIsoDate(deadline),
  };
}

const INCOME_12MO_PROFILE_SYNC = [
  {
    fieldId: "income",
    profileKey: "monthlyIncome",
    toProfile: (value: string | number | boolean) => Number(value) / 12,
    fromProfile: (value: number) => Math.round(value * 12),
  },
];

function payoutLines(sdz: number, gross: number, extra: ResultLine[] = []): ResultLine[] {
  const ndfl = gross * FLAT_NDFL_RATE;
  const net = gross - ndfl;
  return [
    ...extra,
    { label: "Среднедневной заработок", value: formatCurrency(sdz) },
    { label: "Отпускные (до вычета НДФЛ)", value: formatCurrency(gross) },
    {
      label: "НДФЛ (13%)",
      value: formatCurrency(ndfl),
      hint: "При годовом доходе свыше 2 400 000 ₽ ставка может быть выше - см. калькулятор НДФЛ",
    },
    { label: "Отпускные на руки", value: formatCurrency(net), emphasis: true },
  ];
}

/** Пошаговый разбор того же расчёта, что и в payoutLines() - для блока "Показать расчёт по шагам". */
function payoutBreakdown(
  sdz: number,
  gross: number,
  days: number,
  sdzStep: BreakdownStep,
): BreakdownStep[] {
  const ndfl = gross * FLAT_NDFL_RATE;
  const net = gross - ndfl;
  return [
    sdzStep,
    {
      label: "Отпускные до вычета НДФЛ",
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
      label: "Отпускные на руки",
      formula: `${formatCurrency(gross)} − ${formatCurrency(ndfl)}`,
      result: formatCurrency(net),
    },
  ];
}

function simpleCalculate(values: CalculatorValues): CalculationResult {
  const income = Number(values.income);
  const days = Number(values.days);

  if (income <= 0) return { ok: false, error: "Доход должен быть больше нуля" };
  if (days <= 0) return { ok: false, error: "Количество дней отпуска должно быть больше нуля" };

  const { sdz, gross } = calculateVacationPay(income, days);
  const net = gross - gross * FLAT_NDFL_RATE;
  return {
    ok: true,
    lines: payoutLines(sdz, gross),
    breakdown: payoutBreakdown(sdz, gross, days, {
      label: "Среднедневной заработок",
      formula: `${formatCurrency(income)} / 12 / 29,3`,
      result: formatCurrency(sdz),
      lawLabel: "Положение № 540",
      lawHref: POSTANOVLENIE_540_HREF,
    }),
    calendarReminder: buildCalendarReminder(values.vacationStartDate as string | undefined, net),
  };
}

function preciseCalculate(values: CalculatorValues): CalculationResult {
  const income = Number(values.income);
  const fullMonths = Number(values.fullMonths);
  const calendarDays = Number(values.calendarDays);
  const workedDays = Number(values.workedDays);
  const days = Number(values.days);

  if (income <= 0) return { ok: false, error: "Доход должен быть больше нуля" };
  if (days <= 0) return { ok: false, error: "Количество дней отпуска должно быть больше нуля" };
  if (workedDays > calendarDays) {
    return { ok: false, error: "Отработанных дней не может быть больше календарных дней месяца" };
  }

  const { sdz, gross, periodDays } = calculateVacationPayWithIncompleteMonth(
    income,
    fullMonths,
    calendarDays,
    workedDays,
    days,
  );
  const net = gross - gross * FLAT_NDFL_RATE;

  return {
    ok: true,
    lines: payoutLines(sdz, gross, [
      {
        label: "Скорректированный расчётный период",
        value: `${formatNumber(periodDays)} дн.`,
        hint: "29,3 × полных месяцев + 29,3 ⁄ календарных дней месяца × отработанных дней неполного месяца",
      },
    ]),
    breakdown: payoutBreakdown(sdz, gross, days, {
      label: "Среднедневной заработок",
      formula: `${formatCurrency(income)} / ${formatNumber(periodDays)} дн.`,
      result: formatCurrency(sdz),
      note: `Скорректированный период: 29,3 × ${fullMonths} мес. + 29,3 / ${calendarDays} × ${workedDays} дн. = ${formatNumber(periodDays)} дн.`,
      lawLabel: "Положение № 540",
      lawHref: POSTANOVLENIE_540_HREF,
    }),
    calendarReminder: buildCalendarReminder(values.vacationStartDate as string | undefined, net),
  };
}

export function OtpusknyeCalculatorForm() {
  const [mode, setMode] = useState<"simple" | "precise">("simple");
  const isFirstRender = useRef(true);

  // Восстанавливает режим из ссылки (?mode=precise), если она была расшарена в этом состоянии.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- чтение URL возможно только на клиенте
    if (params.get("mode") === "precise") setMode("precise");
  }, []);

  // Сохраняет текущий режим в URL, не трогая параметры полей - их пишет сам <Calculator>.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set("mode", mode);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, [mode]);

  return (
    <div>
      <div className="mb-4 flex gap-2 text-sm" role="tablist" aria-label="Режим расчёта">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "simple"}
          onClick={() => setMode("simple")}
          className={`rounded-lg px-3 py-2 transition-colors ${
            mode === "simple"
              ? "bg-accent text-accent-foreground"
              : "border border-border hover:border-accent"
          }`}
        >
          Все 12 месяцев отработаны полностью
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "precise"}
          onClick={() => setMode("precise")}
          className={`rounded-lg px-3 py-2 transition-colors ${
            mode === "precise"
              ? "bg-accent text-accent-foreground"
              : "border border-border hover:border-accent"
          }`}
        >
          Был неполный месяц
        </button>
      </div>

      {mode === "simple" ? (
        <Calculator
          key="simple"
          historyId="simple"
          profileSync={INCOME_12MO_PROFILE_SYNC}
          resultCardTitle="Отпускные"
          fields={[
            {
              id: "income",
              type: "number",
              label: "Доход за последние 12 месяцев",
              unit: "₽",
              min: 0,
              placeholder: "Например, 960000",
              hint: "Оклад, премии, надбавки - без больничных, отпускных и матпомощи (см. пояснение ниже)",
            },
            {
              id: "days",
              type: "number",
              label: "Количество дней отпуска",
              unit: "дней",
              min: 1,
              max: 365,
              placeholder: "Например, 14",
            },
            vacationStartDateField,
          ]}
          calculate={simpleCalculate}
        />
      ) : (
        <Calculator
          key="precise"
          historyId="precise"
          profileSync={INCOME_12MO_PROFILE_SYNC}
          resultCardTitle="Отпускные"
          fields={[
            {
              id: "income",
              type: "number",
              label: "Доход за последние 12 месяцев",
              unit: "₽",
              min: 0,
              placeholder: "Например, 960000",
              hint: "Без учёта неполного месяца из расчёта ниже",
            },
            {
              id: "fullMonths",
              type: "number",
              label: "Полностью отработанных месяцев из 12",
              min: 0,
              max: 11,
              defaultValue: 11,
            },
            {
              id: "calendarDays",
              type: "number",
              label: "Календарных дней в неполном месяце",
              unit: "дней",
              min: 28,
              max: 31,
              defaultValue: 30,
            },
            {
              id: "workedDays",
              type: "number",
              label: "Отработано дней в неполном месяце",
              unit: "дней",
              min: 1,
              max: 31,
              placeholder: "Например, 20",
            },
            {
              id: "days",
              type: "number",
              label: "Количество дней отпуска",
              unit: "дней",
              min: 1,
              max: 365,
              placeholder: "Например, 14",
            },
            vacationStartDateField,
          ]}
          calculate={preciseCalculate}
        />
      )}
    </div>
  );
}
