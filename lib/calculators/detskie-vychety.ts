import {
  CHILD_DEDUCTION_2026,
  CHILD_DEDUCTION_INCOME_LIMIT_2026,
} from "@/lib/calculators/constants";
import { calculateAnnualNdfl } from "@/lib/calculators/ndfl";

/** Сумма стандартного вычета на всех детей (по очерёдности) плюс надбавка за детей-инвалидов. */
export function calculateMonthlyDeductionAmount(
  childrenCount: number,
  disabledChildrenCount: number,
): number {
  let total = 0;
  for (let i = 1; i <= childrenCount; i++) {
    if (i === 1) total += CHILD_DEDUCTION_2026.first;
    else if (i === 2) total += CHILD_DEDUCTION_2026.second;
    else total += CHILD_DEDUCTION_2026.thirdAndNext;
  }
  total += disabledChildrenCount * CHILD_DEDUCTION_2026.disabled;
  return total;
}

export type ChildDeductionCalculation = {
  monthlyDeduction: number;
  monthsWithDeduction: number;
  annualDeductionTotal: number;
  annualSavings: number;
  avgMonthlySavings: number;
  /** НДФЛ за год без учёта вычета - для пошагового разбора. */
  taxWithoutDeduction: number;
  /** НДФЛ за год с учётом вычета - для пошагового разбора. */
  taxWithDeduction: number;
};

export function calculateChildDeductionSavings(
  monthlyIncome: number,
  childrenCount: number,
  disabledChildrenCount: number,
  doubleDeduction: boolean,
): ChildDeductionCalculation {
  const baseMonthlyDeduction = calculateMonthlyDeductionAmount(
    childrenCount,
    disabledChildrenCount,
  );
  const monthlyDeduction = baseMonthlyDeduction * (doubleDeduction ? 2 : 1);

  const monthsWithDeduction =
    monthlyIncome > 0
      ? Math.min(Math.floor(CHILD_DEDUCTION_INCOME_LIMIT_2026 / monthlyIncome), 12)
      : 0;
  const annualDeductionTotal = monthlyDeduction * monthsWithDeduction;

  const annualIncome = monthlyIncome * 12;
  const taxWithoutDeduction = calculateAnnualNdfl(annualIncome).totalTax;
  const taxWithDeduction = calculateAnnualNdfl(
    Math.max(annualIncome - annualDeductionTotal, 0),
  ).totalTax;
  const annualSavings = taxWithoutDeduction - taxWithDeduction;

  return {
    monthlyDeduction,
    monthsWithDeduction,
    annualDeductionTotal,
    annualSavings,
    avgMonthlySavings: annualSavings / 12,
    taxWithoutDeduction,
    taxWithDeduction,
  };
}
