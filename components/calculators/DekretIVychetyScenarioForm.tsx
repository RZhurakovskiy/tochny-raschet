"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
} from "@/components/Calculator";
import {
  calculateMaternityBenefit,
  MATERNITY_LEAVE_DAYS_AFTER_BIRTH,
  type MaternityBenefitCalculation,
  type MaternityLeaveType,
} from "@/lib/calculators/dekretnye";
import {
  calculateChildCareAllowance,
  type ChildCareAllowanceCalculation,
} from "@/lib/calculators/uhod-za-rebenkom";
import {
  calculateChildDeductionSavings,
  type ChildDeductionCalculation,
} from "@/lib/calculators/detskie-vychety";
import { calculateFullMonthsBetweenDates, addDays, addMonths } from "@/lib/calculators/date-utils";
import { formatCurrency } from "@/lib/format";

const MONTHS_PER_2_YEARS = 24;
const CHILD_CARE_LIMIT_MONTHS = 18;
const SDZ_LAW_HREF =
  "https://www.consultant.ru/document/cons_doc_LAW_64871/577325721f414027e15ab7d9aac146e82cffa46f/";

/** Пошаговый разбор того же расчёта, что и в calculate() - для блока "Показать расчёт по шагам". */
function buildBreakdown(
  income2Years: number,
  monthlySalary: number,
  maternity: MaternityBenefitCalculation,
  childCare: ChildCareAllowanceCalculation,
  childCareMonths: number,
  childCareTotal: number,
  deduction: ChildDeductionCalculation,
): BreakdownStep[] {
  return [
    {
      label: "Декретные - среднедневной заработок",
      formula: `${formatCurrency(income2Years)} / 730`,
      result: formatCurrency(maternity.rawSdz),
      note: maternity.cappedByMax
        ? `Выше максимума 2026 года - в расчёт идёт ${formatCurrency(maternity.sdz)}`
        : maternity.raisedToMin
          ? `Ниже минимума из МРОТ - в расчёт идёт ${formatCurrency(maternity.sdz)}`
          : undefined,
      lawLabel: "ст. 14 закона № 255-ФЗ",
      lawHref: SDZ_LAW_HREF,
    },
    {
      label: "Декретные - пособие одной суммой",
      formula: `${formatCurrency(maternity.sdz)} × ${maternity.days} дн.`,
      result: formatCurrency(maternity.benefit),
      note: "Не облагается НДФЛ",
      lawLabel: "ст. 10 закона № 255-ФЗ",
    },
    {
      label: "Уход за ребёнком - пособие в месяц",
      formula: `${formatCurrency(income2Years)} / 730 × 30,4 × 40%`,
      result: formatCurrency(childCare.rawMonthlyAllowance),
      note: childCare.cappedByMax
        ? `Выше максимума 2026 года - в расчёт идёт ${formatCurrency(childCare.monthlyAllowance)}`
        : childCare.raisedToMin
          ? `Ниже минимума 2026 года - в расчёт идёт ${formatCurrency(childCare.monthlyAllowance)}`
          : undefined,
    },
    {
      label: "Уход за ребёнком - итого за весь период",
      formula: `${formatCurrency(childCare.monthlyAllowance)} × ${childCareMonths} мес.`,
      result: formatCurrency(childCareTotal),
      note: "С окончания отпуска по БиР до 1,5 лет ребёнку",
    },
    {
      label: "Вычет на детей - сумма в месяц",
      result: formatCurrency(deduction.monthlyDeduction),
      lawLabel: "ст. 218 НК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/nk/st-218",
    },
    {
      label: "Вычет на детей - экономия по НДФЛ в месяц",
      formula: `${formatCurrency(monthlySalary * 12)} доход в год, ${formatCurrency(deduction.annualSavings)} экономии в год`,
      result: formatCurrency(deduction.avgMonthlySavings),
      note: "Начинает действовать не сразу, а когда вы вернётесь к зарплате после декрета и отпуска по уходу",
    },
  ];
}

function calculate(values: CalculatorValues): CalculationResult {
  const birthDate = new Date(String(values.birthDate));
  const monthlySalary = Number(values.monthlySalary);
  const leaveType = values.leaveType as MaternityLeaveType;
  const childrenCount = Number(values.childrenCount);
  const disabledChildrenCount = Number(values.disabledChildrenCount);
  const doubleDeduction = Boolean(values.doubleDeduction);

  if (monthlySalary <= 0) return { ok: false, error: "Зарплата должна быть больше нуля" };
  if (disabledChildrenCount > childrenCount) {
    return { ok: false, error: "Детей-инвалидов не может быть больше общего числа детей" };
  }

  const income2Years = monthlySalary * MONTHS_PER_2_YEARS;

  const maternity = calculateMaternityBenefit(income2Years, leaveType);
  const childCare = calculateChildCareAllowance(income2Years);
  const deduction = calculateChildDeductionSavings(
    monthlySalary,
    childrenCount,
    disabledChildrenCount,
    doubleDeduction,
  );

  const childCareStart = addDays(birthDate, MATERNITY_LEAVE_DAYS_AFTER_BIRTH[leaveType]);
  const childCareEnd = addMonths(birthDate, CHILD_CARE_LIMIT_MONTHS);
  const childCareMonths = calculateFullMonthsBetweenDates(childCareStart, childCareEnd);
  const childCareTotal = childCare.monthlyAllowance * childCareMonths;

  return {
    ok: true,
    lines: [
      { label: "Декретные - дней отпуска по БиР", value: `${maternity.days} дн.` },
      {
        label: "Декретные - среднедневной заработок",
        value: formatCurrency(maternity.sdz),
        hint: maternity.cappedByMax
          ? "Расчётный СДЗ выше максимума 2026 года - использован потолок"
          : maternity.raisedToMin
            ? "Расчётный СДЗ ниже минимума из МРОТ - использован минимум 2026 года"
            : undefined,
      },
      {
        label: "Декретные - пособие одной суммой",
        value: formatCurrency(maternity.benefit),
        hint: "Не облагается НДФЛ, выплачивается перед началом отпуска по уходу",
      },
      {
        label: "Уход за ребёнком - пособие в месяц",
        value: formatCurrency(childCare.monthlyAllowance),
        hint: childCare.cappedByMax
          ? "Выше максимума 2026 года - использован потолок 83 021,18 ₽"
          : childCare.raisedToMin
            ? "Ниже минимума 2026 года - использован минимум 10 837,20 ₽"
            : "40% среднего заработка",
      },
      {
        label: "Уход за ребёнком - выплачивается",
        value: `${childCareMonths} мес.`,
        hint: "С окончания отпуска по БиР до 1,5 лет ребёнку - дальше отпуск можно продлить до 3 лет, но пособие уже не платится",
      },
      {
        label: "Уход за ребёнком - итого за весь период",
        value: formatCurrency(childCareTotal),
        emphasis: true,
      },
      {
        label: "Вычет на детей - сумма в месяц",
        value: formatCurrency(deduction.monthlyDeduction),
        hint: "Начинает действовать не сразу, а когда вы вернётесь к зарплате - во время декрета и отпуска по уходу облагаемого НДФЛ дохода нет",
      },
      {
        label: "Вычет на детей - экономия по НДФЛ в месяц",
        value: formatCurrency(deduction.avgMonthlySavings),
      },
    ],
    breakdown: buildBreakdown(
      income2Years,
      monthlySalary,
      maternity,
      childCare,
      childCareMonths,
      childCareTotal,
      deduction,
    ),
  };
}

export function DekretIVychetyScenarioForm() {
  return (
    <Calculator
      resultCardTitle="Выплаты в декрете"
      profileSync={[
        {
          fieldId: "monthlySalary",
          profileKey: "monthlyIncome",
          toProfile: (value) => Number(value),
          fromProfile: (value) => value,
        },
        {
          fieldId: "childrenCount",
          profileKey: "childrenCount",
          toProfile: (value) => Number(value),
          fromProfile: (value) => value,
        },
      ]}
      fields={[
        {
          id: "birthDate",
          type: "date",
          label: "Дата родов",
          hint: "Если роды ещё не наступили - укажите предполагаемую дату по больничному листу",
        },
        {
          id: "monthlySalary",
          type: "number",
          label: "Зарплата в месяц",
          unit: "₽",
          min: 0,
          placeholder: "Например, 80000",
          hint: "Используется для декретных и пособия по уходу - в расчёте считается неизменной за последние 2 года",
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
        {
          id: "childrenCount",
          type: "number",
          label: "Сколько всего детей в семье (включая этого)",
          min: 1,
          max: 10,
          defaultValue: 1,
        },
        {
          id: "disabledChildrenCount",
          type: "number",
          label: "Из них детей-инвалидов",
          min: 0,
          max: 10,
          defaultValue: 0,
          hint: "Даёт дополнительно 12 000 ₽ к вычету на каждого такого ребёнка",
        },
        {
          id: "doubleDeduction",
          type: "checkbox",
          label:
            "Вычет в двойном размере (единственный родитель или отказ второго родителя в вашу пользу)",
        },
      ]}
      calculate={calculate}
    />
  );
}
