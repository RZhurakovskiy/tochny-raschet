"use client";

import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
  type ResultLine,
} from "@/components/Calculator";
import {
  calculateTrudVsSamozanyatost,
  type NpdClientType,
  type SickLeaveInsuredSum,
  type TrudVsSamozanyatostCalculation,
} from "@/lib/calculators/trud-vs-samozanyatost";
import { formatCurrency } from "@/lib/format";

const NPD_LAW_HREF = "https://www.consultant.ru/document/cons_doc_LAW_311977/";

/** Пошаговый разбор того же расчёта, что и в calculate() - для блока "Показать расчёт по шагам". */
function buildBreakdown(
  monthlyIncome: number,
  result: TrudVsSamozanyatostCalculation,
): BreakdownStep[] {
  const {
    npdRate,
    employmentNetMonthly,
    employmentTaxMonthly,
    selfEmployedNetMonthly,
    selfEmployedTaxMonthly,
    monthlyPensionContribution,
    monthlySickLeaveContribution,
    selfEmployedNetWithParityMonthly,
  } = result;

  return [
    {
      label: "Трудовой договор - НДФЛ по прогрессивной шкале",
      result: formatCurrency(employmentTaxMonthly),
      lawLabel: "ст. 224 НК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/nk/st-224",
    },
    {
      label: "Трудовой договор - на руки",
      formula: `${formatCurrency(monthlyIncome)} − ${formatCurrency(employmentTaxMonthly)}`,
      result: formatCurrency(employmentNetMonthly),
    },
    {
      label: `Самозанятость - НПД ${npdRate * 100}%`,
      formula: `${formatCurrency(monthlyIncome)} × ${npdRate * 100}%`,
      result: formatCurrency(selfEmployedTaxMonthly),
      lawLabel: "закон № 422-ФЗ",
      lawHref: NPD_LAW_HREF,
    },
    {
      label: "Самозанятость - на руки",
      formula: `${formatCurrency(monthlyIncome)} − ${formatCurrency(selfEmployedTaxMonthly)}`,
      result: formatCurrency(selfEmployedNetMonthly),
    },
    {
      label: "Паритет - добровольные взносы",
      formula: `${formatCurrency(monthlyPensionContribution)} (пенсия) + ${formatCurrency(monthlySickLeaveContribution)} (больничный)`,
      result: formatCurrency(monthlyPensionContribution + monthlySickLeaveContribution),
      note: "Чтобы получить тот же пенсионный стаж и страхование по больничному, что у трудоустроенного по умолчанию",
    },
    {
      label: "Самозанятость - на руки с равным соцпакетом",
      formula: `${formatCurrency(selfEmployedNetMonthly)} − ${formatCurrency(monthlyPensionContribution)} − ${formatCurrency(monthlySickLeaveContribution)}`,
      result: formatCurrency(selfEmployedNetWithParityMonthly),
    },
  ];
}

function calculate(values: CalculatorValues): CalculationResult {
  const monthlyIncome = Number(values.monthlyIncome);
  const clientType = values.clientType as NpdClientType;
  const sickLeaveInsuredSum = values.sickLeaveInsuredSum as SickLeaveInsuredSum;

  if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
    return { ok: false, error: "Введите доход в месяц больше нуля" };
  }

  const comparisonResult = calculateTrudVsSamozanyatost(
    monthlyIncome,
    clientType,
    sickLeaveInsuredSum,
  );
  const {
    npdRate,
    employmentNetMonthly,
    employmentTaxMonthly,
    selfEmployedNetMonthly,
    selfEmployedTaxMonthly,
    monthlyPensionContribution,
    monthlySickLeaveContribution,
    selfEmployedNetWithParityMonthly,
  } = comparisonResult;

  const diffSimple = selfEmployedNetMonthly - employmentNetMonthly;
  const diffParity = selfEmployedNetWithParityMonthly - employmentNetMonthly;

  const lines: ResultLine[] = [
    {
      label: "На руки по трудовому договору",
      value: formatCurrency(employmentNetMonthly),
      hint: `НДФЛ ${formatCurrency(employmentTaxMonthly)} в месяц по прогрессивной шкале`,
    },
    {
      label: "На руки как самозанятый",
      value: formatCurrency(selfEmployedNetMonthly),
      hint: `Налог НПД ${npdRate * 100}% -${formatCurrency(selfEmployedTaxMonthly)} в месяц`,
    },
    {
      label: "Разница на руки",
      value: `${diffSimple >= 0 ? "+" : "−"}${formatCurrency(Math.abs(diffSimple))}`,
      hint: "Без учёта добровольных взносов на пенсию и больничный - просто сравнение налоговой нагрузки",
    },
    {
      label: "На руки как самозанятый с равным соцпакетом",
      value: formatCurrency(selfEmployedNetWithParityMonthly),
      hint: `Минус добровольные взносы: пенсия ${formatCurrency(
        monthlyPensionContribution,
      )} + больничный ${formatCurrency(monthlySickLeaveContribution)} в месяц`,
      emphasis: true,
    },
    {
      label: "Разница с учётом соцпакета",
      value: `${diffParity >= 0 ? "+" : "−"}${formatCurrency(Math.abs(diffParity))}`,
      hint: "Если самозанятый сам покупает тот же пенсионный стаж и страхование по больничному, что у трудоустроенного по умолчанию",
    },
  ];

  return { ok: true, lines, breakdown: buildBreakdown(monthlyIncome, comparisonResult) };
}

export function TrudVsSamozanyatostCalculatorForm() {
  return (
    <Calculator
      resultCardTitle="Трудовой договор vs самозанятость"
      profileSync={[
        {
          fieldId: "monthlyIncome",
          profileKey: "monthlyIncome",
          toProfile: (v) => Number(v),
          fromProfile: (v) => v,
        },
      ]}
      fields={[
        {
          id: "monthlyIncome",
          type: "number",
          label: "Доход в месяц",
          hint: "Одна и та же сумма, которую вы получаете за работу в обоих вариантах",
          unit: "₽",
          min: 0,
          placeholder: "Например, 150000",
        },
        {
          id: "clientType",
          type: "radio",
          label: "От кого доход как у самозанятого",
          options: [
            { value: "individuals", label: "От физлиц (налог 4%)" },
            { value: "businesses", label: "От компаний и ИП (налог 6%)" },
          ],
          defaultValue: "individuals",
        },
        {
          id: "sickLeaveInsuredSum",
          type: "radio",
          label: "Страховая сумма для добровольного больничного",
          hint: "Это не расчёт, а готовые тарифы программы СФР - сколько получите за месяц болезни. Взнос = 3,84% от выбранной суммы, не зависит от дохода выше. Учитывается только в строке «с равным соцпакетом»",
          options: [
            { value: "low", label: "35 000 ₽/мес (взнос 1 344 ₽)" },
            { value: "high", label: "50 000 ₽/мес (взнос 1 920 ₽)" },
          ],
          defaultValue: "low",
        },
      ]}
      calculate={calculate}
    />
  );
}
