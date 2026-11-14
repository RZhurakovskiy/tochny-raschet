"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
  type ResultLine,
} from "@/components/Calculator";
import {
  calculateChildCareSickLeaveBenefit,
  CHILD_CARE_ANNUAL_DAY_LIMIT,
  type ChildAgeGroup,
  type ChildCareSickLeaveCalculation,
  type TreatmentSetting,
} from "@/lib/calculators/bolnichnyy-po-uhodu";
import { formatCurrency } from "@/lib/format";

const FLAT_NDFL_RATE = 0.13;
const SDZ_LAW_HREF =
  "https://www.consultant.ru/document/cons_doc_LAW_64871/577325721f414027e15ab7d9aac146e82cffa46f/";

/** Пошаговый разбор того же расчёта, что и в calculate() - для блока "Показать расчёт по шагам". */
function buildBreakdown(
  income2Years: number,
  childAge: ChildAgeGroup,
  result: ChildCareSickLeaveCalculation,
): BreakdownStep[] {
  const { rawSdz, sdz, cappedByMax, raisedToMin, rate, fullRateDays, reducedRateDays, benefit } =
    result;
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
  ];

  if (childAge === "under8") {
    steps.push({
      label: "Пособие до вычета НДФЛ",
      formula: `${formatCurrency(sdz)} × 100% × ${fullRateDays} дн.`,
      result: formatCurrency(benefit),
      note: "До 8 лет - всегда 100%, независимо от страхового стажа",
      lawLabel: "ст. 7 закона № 255-ФЗ",
    });
  } else if (reducedRateDays > 0) {
    steps.push({
      label: `Первые ${fullRateDays} дн. - по стажу (${rate * 100}%)`,
      formula: `${formatCurrency(sdz)} × ${rate * 100}% × ${fullRateDays} дн.`,
      result: formatCurrency(sdz * rate * fullRateDays),
    });
    steps.push({
      label: `Остальные ${reducedRateDays} дн. - по 50%`,
      formula: `${formatCurrency(sdz)} × 50% × ${reducedRateDays} дн.`,
      result: formatCurrency(sdz * 0.5 * reducedRateDays),
      note: "При амбулаторном лечении ребёнка 8-15 лет дни сверх первых 10 оплачиваются вполовину",
    });
    steps.push({
      label: "Пособие до вычета НДФЛ",
      formula: `${formatCurrency(sdz * rate * fullRateDays)} + ${formatCurrency(sdz * 0.5 * reducedRateDays)}`,
      result: formatCurrency(benefit),
    });
  } else {
    steps.push({
      label: "Пособие до вычета НДФЛ",
      formula: `${formatCurrency(sdz)} × ${rate * 100}% × ${fullRateDays} дн.`,
      result: formatCurrency(benefit),
    });
  }

  steps.push({
    label: "НДФЛ 13%",
    formula: `${formatCurrency(benefit)} × 13%`,
    result: formatCurrency(ndfl),
    lawLabel: "ст. 224 НК РФ",
    lawHref: "https://pravo.ppt.ru/kodeks/nk/st-224",
  });
  steps.push({
    label: "Пособие на руки",
    formula: `${formatCurrency(benefit)} − ${formatCurrency(ndfl)}`,
    result: formatCurrency(net),
  });

  return steps;
}

function calculate(values: CalculatorValues): CalculationResult {
  const income2Years = Number(values.income2Years);
  const insuranceYears = Number(values.insuranceYears);
  const days = Number(values.days);
  const childAge = values.childAge as ChildAgeGroup;
  const treatmentSetting = values.treatmentSetting as TreatmentSetting;

  if (income2Years < 0) return { ok: false, error: "Доход не может быть отрицательным" };
  if (days <= 0) return { ok: false, error: "Количество дней больничного должно быть больше нуля" };
  if (childAge === "15to18" && treatmentSetting === "inpatient") {
    return {
      ok: false,
      error:
        "Для ребёнка 15-18 лет больничный по уходу оформляют только при амбулаторном лечении - выберите «Амбулаторно»",
    };
  }

  const childCareResult = calculateChildCareSickLeaveBenefit(
    income2Years,
    insuranceYears,
    days,
    childAge,
    treatmentSetting,
  );
  const { rawSdz, sdz, cappedByMax, raisedToMin, rate, fullRateDays, reducedRateDays, benefit } =
    childCareResult;

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

  if (childAge === "under8") {
    lines.push({
      label: "Процент оплаты",
      value: "100%",
      hint: "До 8 лет больничный по уходу за ребёнком оплачивается в полном размере независимо от стажа (ст. 7 закона № 255-ФЗ)",
    });
  } else {
    lines.push({ label: "Процент оплаты по стажу", value: `${rate * 100}%` });
    if (reducedRateDays > 0) {
      lines.push({
        label: "Дни по сниженной ставке",
        value: `${reducedRateDays} дн. по 50%`,
        hint: `Первые ${fullRateDays} дн. амбулаторного лечения - по стажу, дальше - 50% среднего заработка`,
      });
    }
  }

  const annualLimit = CHILD_CARE_ANNUAL_DAY_LIMIT[childAge];
  if (days > annualLimit) {
    lines.push({
      label: "Годовой лимит дней по уходу за этим ребёнком",
      value: `${annualLimit} дн.`,
      hint: "Дни сверх лимита СФР за календарный год не оплачивает",
    });
  }

  const ndfl = benefit * FLAT_NDFL_RATE;
  const net = benefit - ndfl;

  lines.push({ label: "Пособие (до вычета НДФЛ)", value: formatCurrency(benefit) });
  lines.push({ label: "НДФЛ (13%)", value: formatCurrency(ndfl) });
  lines.push({ label: "Пособие на руки", value: formatCurrency(net), emphasis: true });

  return { ok: true, lines, breakdown: buildBreakdown(income2Years, childAge, childCareResult) };
}

export function BolnichnyyPoUhoduCalculatorForm() {
  return (
    <Calculator
      resultCardTitle="Больничный по уходу за ребёнком"
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
          label: "Ваш доход за 2024 и 2025 годы",
          unit: "₽",
          min: 0,
          placeholder: "Например, 1800000",
          hint: "Доход родителя/опекуна, ухаживающего за ребёнком, за 2 календарных года, предшествующих году болезни",
        },
        {
          id: "insuranceYears",
          type: "number",
          label: "Ваш страховой стаж",
          unit: "лет",
          min: 0,
          max: 80,
          placeholder: "Например, 6",
          hint: "Не важен, если ребёнку меньше 8 лет - в этом случае оплата всегда 100%",
        },
        {
          id: "childAge",
          type: "radio",
          label: "Возраст ребёнка",
          options: [
            { value: "under8", label: "До 8 лет" },
            { value: "8to15", label: "От 8 до 15 лет" },
            { value: "15to18", label: "От 15 до 18 лет" },
          ],
          defaultValue: "under8",
        },
        {
          id: "treatmentSetting",
          type: "radio",
          label: "Лечение",
          hint: "Для ребёнка 15-18 лет больничный по уходу оформляют только амбулаторно",
          options: [
            { value: "outpatient", label: "Амбулаторно (дома)" },
            { value: "inpatient", label: "В стационаре (с ребёнком)" },
          ],
          defaultValue: "outpatient",
        },
        {
          id: "days",
          type: "number",
          label: "Количество дней больничного",
          unit: "дней",
          min: 1,
          max: 120,
          placeholder: "Например, 5",
        },
      ]}
      calculate={calculate}
    />
  );
}
