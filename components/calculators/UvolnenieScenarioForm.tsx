"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorField,
  type CalculatorValues,
} from "@/components/Calculator";
import { calculateVacationCompensation } from "@/lib/calculators/kompensaciya-otpuska";
import { calculateFullMonthsBetweenDates } from "@/lib/calculators/date-utils";
import { calculateSeveranceBenefit } from "@/lib/calculators/vykhodnoe-posobie";
import { formatCurrency, formatNumber } from "@/lib/format";

/** Общие шаги "компенсация за отпуск" - переиспользуются в обоих вариантах calculate() ниже. */
function compensationBreakdown(
  fullMonths: number,
  days: number,
  sdz: number,
  gross: number,
  ndfl: number,
  net: number,
): BreakdownStep[] {
  return [
    {
      label: "Отпуск - дней компенсации",
      result: `${formatNumber(days)} дн.`,
      note: `2,33 × ${fullMonths} мес. отработано`,
      lawLabel: "ст. 127 ТК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/tk/st-127",
    },
    { label: "Отпуск - среднедневной заработок", result: formatCurrency(sdz) },
    {
      label: "Отпуск - компенсация до вычета НДФЛ",
      formula: `${formatCurrency(sdz)} × ${formatNumber(days)} дн.`,
      result: formatCurrency(gross),
    },
    {
      label: "Отпуск - НДФЛ 13%",
      formula: `${formatCurrency(gross)} × 13%`,
      result: formatCurrency(ndfl),
      lawLabel: "ст. 224 НК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/nk/st-224",
    },
    {
      label: "Отпуск - компенсация на руки",
      formula: `${formatCurrency(gross)} − ${formatCurrency(ndfl)}`,
      result: formatCurrency(net),
    },
  ];
}

const FLAT_NDFL_RATE = 0.13;
const MONTHS_PER_YEAR = 12;

const dateFields: CalculatorField[] = [
  { id: "hireDate", type: "date", label: "Дата трудоустройства" },
  { id: "terminationDate", type: "date", label: "Дата увольнения" },
  {
    id: "monthlySalary",
    type: "number",
    label: "Зарплата в месяц",
    unit: "₽",
    min: 0,
    placeholder: "Например, 80000",
    hint: "Используется для расчёта компенсации - в расчёте считается неизменной за последние 12 месяцев",
  },
  {
    id: "usedDays",
    type: "number",
    label: "Всего использовано дней отпуска за весь период работы",
    unit: "дней",
    min: 0,
    max: 3650,
    defaultValue: 0,
    hint: "Не только за последний год - неиспользованные дни за прошлые годы не сгорают, поэтому нужна сумма за всё время с момента трудоустройства",
  },
];

function parseAndValidateDates(values: CalculatorValues) {
  const hireDate = new Date(String(values.hireDate));
  const terminationDate = new Date(String(values.terminationDate));
  if (terminationDate <= hireDate) return null;
  return { hireDate, terminationDate };
}

function calculateCompensationOnly(values: CalculatorValues): CalculationResult {
  const monthlySalary = Number(values.monthlySalary);
  const usedDays = Number(values.usedDays);

  if (monthlySalary <= 0) return { ok: false, error: "Зарплата должна быть больше нуля" };
  const dates = parseAndValidateDates(values);
  if (!dates) {
    return { ok: false, error: "Дата увольнения должна быть позже даты трудоустройства" };
  }

  const income12Months = monthlySalary * MONTHS_PER_YEAR;
  const fullMonths = calculateFullMonthsBetweenDates(dates.hireDate, dates.terminationDate);
  const { sdz, days, gross } = calculateVacationCompensation(income12Months, fullMonths, usedDays);
  const ndfl = gross * FLAT_NDFL_RATE;
  const net = gross - ndfl;

  return {
    ok: true,
    lines: [
      {
        label: "Отработано полных месяцев",
        value: `${fullMonths} мес.`,
        hint: "За весь период с даты трудоустройства до даты увольнения",
      },
      { label: "Дней компенсации", value: `${formatNumber(days)} дн.` },
      { label: "Компенсация (до вычета НДФЛ)", value: formatCurrency(gross) },
      {
        label: "НДФЛ (13%)",
        value: formatCurrency(ndfl),
        hint: "При высоком годовом доходе ставка может быть выше - см. калькулятор НДФЛ",
      },
      {
        label: "Компенсация на руки",
        value: formatCurrency(net),
        hint: "Выходное пособие сюда не входит - при увольнении по собственному желанию или по соглашению сторон оно не гарантировано законом",
        emphasis: true,
      },
    ],
    breakdown: compensationBreakdown(fullMonths, days, sdz, gross, ndfl, net),
  };
}

function calculateWithSeverance(values: CalculatorValues): CalculationResult {
  const monthlySalary = Number(values.monthlySalary);
  const usedDays = Number(values.usedDays);
  const month2Paid = Boolean(values.month2Paid);
  const month3Paid = Boolean(values.month3Paid);

  if (monthlySalary <= 0) return { ok: false, error: "Зарплата должна быть больше нуля" };
  const dates = parseAndValidateDates(values);
  if (!dates) {
    return { ok: false, error: "Дата увольнения должна быть позже даты трудоустройства" };
  }
  if (month3Paid && !month2Paid) {
    return {
      ok: false,
      error:
        "Выплата за 3-й месяц возможна, только если вы также не были трудоустроены во 2-й месяц - отметьте оба условия",
    };
  }

  const income12Months = monthlySalary * MONTHS_PER_YEAR;
  const fullMonths = calculateFullMonthsBetweenDates(dates.hireDate, dates.terminationDate);

  const {
    sdz,
    days,
    gross: compensationGross,
  } = calculateVacationCompensation(income12Months, fullMonths, usedDays);
  const compensationNdfl = compensationGross * FLAT_NDFL_RATE;
  const compensationNet = compensationGross - compensationNdfl;

  const {
    avgMonthlyIncome,
    monthsPaid,
    benefit: severanceBenefit,
  } = calculateSeveranceBenefit(income12Months, month2Paid, month3Paid);

  const totalNet = compensationNet + severanceBenefit;

  return {
    ok: true,
    lines: [
      {
        label: "Отработано полных месяцев",
        value: `${fullMonths} мес.`,
        hint: "За весь период с даты трудоустройства до даты увольнения",
      },
      { label: "Отпуск - дней компенсации", value: `${formatNumber(days)} дн.` },
      { label: "Отпуск - компенсация до налога", value: formatCurrency(compensationGross) },
      {
        label: "Отпуск - НДФЛ (13%)",
        value: formatCurrency(compensationNdfl),
        hint: "При высоком годовом доходе ставка может быть выше - см. калькулятор НДФЛ",
      },
      { label: "Отпуск - компенсация на руки", value: formatCurrency(compensationNet) },
      { label: "Пособие - средний месячный заработок", value: formatCurrency(avgMonthlyIncome) },
      {
        label: `Пособие - за ${monthsPaid} мес.`,
        value: formatCurrency(severanceBenefit),
        hint: "НДФЛ не удерживается - в пределах трёхкратного среднего заработка (ст. 217 НК РФ)",
      },
      {
        label: "Итого на руки при увольнении",
        value: formatCurrency(totalNet),
        hint: "Компенсация за отпуск (на руки) + выходное пособие. Не включает зарплату за фактически отработанные дни последнего месяца.",
        emphasis: true,
      },
    ],
    breakdown: [
      ...compensationBreakdown(
        fullMonths,
        days,
        sdz,
        compensationGross,
        compensationNdfl,
        compensationNet,
      ),
      {
        label: "Пособие - средний месячный заработок",
        formula: `${formatCurrency(income12Months)} / 12`,
        result: formatCurrency(avgMonthlyIncome),
      },
      {
        label: `Пособие - за ${monthsPaid} мес.`,
        formula: `${formatCurrency(avgMonthlyIncome)} × ${monthsPaid}`,
        result: formatCurrency(severanceBenefit),
        note: "НДФЛ не удерживается - в пределах трёхкратного среднего заработка",
        lawLabel: "ст. 178 ТК РФ",
        lawHref: "https://pravo.ppt.ru/kodeks/tk/st-178",
      },
      {
        label: "Итого на руки",
        formula: `${formatCurrency(compensationNet)} + ${formatCurrency(severanceBenefit)}`,
        result: formatCurrency(totalNet),
      },
    ],
  };
}

export function UvolnenieScenarioForm() {
  const [reason, setReason] = useState<"sokraschenie" | "own">("sokraschenie");
  const isFirstRender = useRef(true);

  // Восстанавливает причину увольнения из ссылки (?reason=own), если она была расшарена в этом состоянии.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- чтение URL возможно только на клиенте
    if (params.get("reason") === "own") setReason("own");
  }, []);

  // Сохраняет текущую причину в URL, не трогая параметры полей - их пишет сам <Calculator>.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set("reason", reason);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, [reason]);

  return (
    <div>
      <div
        className="mb-4 flex flex-wrap gap-2 text-sm"
        role="tablist"
        aria-label="Причина увольнения"
      >
        <button
          type="button"
          role="tab"
          aria-selected={reason === "sokraschenie"}
          onClick={() => setReason("sokraschenie")}
          className={`rounded-lg px-3 py-2 transition-colors ${
            reason === "sokraschenie"
              ? "bg-accent text-accent-foreground"
              : "border border-border hover:border-accent"
          }`}
        >
          Сокращение штата / ликвидация
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={reason === "own"}
          onClick={() => setReason("own")}
          className={`rounded-lg px-3 py-2 transition-colors ${
            reason === "own"
              ? "bg-accent text-accent-foreground"
              : "border border-border hover:border-accent"
          }`}
        >
          По собственному желанию / соглашению сторон
        </button>
      </div>

      {reason === "sokraschenie" ? (
        <Calculator
          key="sokraschenie"
          historyId="sokraschenie"
          resultCardTitle="Выплаты при сокращении"
          profileSync={[
            {
              fieldId: "monthlySalary",
              profileKey: "monthlyIncome",
              toProfile: (value) => Number(value),
              fromProfile: (value) => value,
            },
          ]}
          fields={[
            ...dateFields,
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
          calculate={calculateWithSeverance}
        />
      ) : (
        <Calculator
          key="own"
          historyId="own"
          resultCardTitle="Компенсация при увольнении"
          profileSync={[
            {
              fieldId: "monthlySalary",
              profileKey: "monthlyIncome",
              toProfile: (value) => Number(value),
              fromProfile: (value) => value,
            },
          ]}
          fields={dateFields}
          calculate={calculateCompensationOnly}
        />
      )}
    </div>
  );
}
