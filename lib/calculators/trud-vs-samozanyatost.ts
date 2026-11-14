import { calculateAnnualNdfl } from "@/lib/calculators/ndfl";
import {
  NPD_RATE_FROM_INDIVIDUALS,
  NPD_RATE_FROM_BUSINESSES,
  VOLUNTARY_PENSION_CONTRIBUTION_ANNUAL_2026,
  SICK_LEAVE_INSURANCE_MONTHLY_CONTRIBUTION_2026,
} from "@/lib/calculators/constants";

export type NpdClientType = "individuals" | "businesses";
export type SickLeaveInsuredSum = "low" | "high";

export type TrudVsSamozanyatostCalculation = {
  monthlyIncome: number;
  npdRate: number;
  employmentNetMonthly: number;
  employmentTaxMonthly: number;
  selfEmployedNetMonthly: number;
  selfEmployedTaxMonthly: number;
  monthlyPensionContribution: number;
  monthlySickLeaveContribution: number;
  selfEmployedNetWithParityMonthly: number;
};

/**
 * Сравнивает один и тот же ежемесячный доход в двух формах: трудовой договор (НДФЛ по
 * прогрессивной шкале) и самозанятость (НПД 4%/6%). Дополнительно считает "паритетный" вариант
 * - сколько остаётся у самозанятого, если он сам покупает себе тот же базовый пакет, что у
 * трудоустроенного есть по умолчанию (страховой пенсионный стаж + добровольное страхование на
 * случай больничного). Отпуск в эту сумму намеренно не переведён - в отличие от налогов и взносов,
 * у него нет единой рублёвой цены, это оговорено в тексте страницы, а не в расчёте.
 */
export function calculateTrudVsSamozanyatost(
  monthlyIncome: number,
  clientType: NpdClientType,
  sickLeaveInsuredSum: SickLeaveInsuredSum,
): TrudVsSamozanyatostCalculation {
  const annualIncome = monthlyIncome * 12;
  const { totalTax: employmentAnnualTax, netAnnualIncome } = calculateAnnualNdfl(annualIncome);
  const employmentNetMonthly = netAnnualIncome / 12;
  const employmentTaxMonthly = employmentAnnualTax / 12;

  const npdRate =
    clientType === "individuals" ? NPD_RATE_FROM_INDIVIDUALS : NPD_RATE_FROM_BUSINESSES;
  const selfEmployedTaxMonthly = monthlyIncome * npdRate;
  const selfEmployedNetMonthly = monthlyIncome - selfEmployedTaxMonthly;

  const monthlyPensionContribution = VOLUNTARY_PENSION_CONTRIBUTION_ANNUAL_2026 / 12;
  const monthlySickLeaveContribution =
    SICK_LEAVE_INSURANCE_MONTHLY_CONTRIBUTION_2026[sickLeaveInsuredSum];
  const selfEmployedNetWithParityMonthly =
    selfEmployedNetMonthly - monthlyPensionContribution - monthlySickLeaveContribution;

  return {
    monthlyIncome,
    npdRate,
    employmentNetMonthly,
    employmentTaxMonthly,
    selfEmployedNetMonthly,
    selfEmployedTaxMonthly,
    monthlyPensionContribution,
    monthlySickLeaveContribution,
    selfEmployedNetWithParityMonthly,
  };
}
