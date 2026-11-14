import {
  MIN_CHILD_CARE_ALLOWANCE_2026,
  MAX_CHILD_CARE_ALLOWANCE_2026,
} from "@/lib/calculators/constants";

const AVERAGE_DAYS_PER_MONTH = 30.4;
const CHILD_CARE_RATE = 0.4;

export type ChildCareAllowanceCalculation = {
  sdz: number;
  rawMonthlyAllowance: number;
  monthlyAllowance: number;
  cappedByMax: boolean;
  raisedToMin: boolean;
};

/**
 * Пособие по уходу за ребёнком до 1,5 лет - 40% среднего заработка, посчитанного так же, как для
 * больничного/декретных (доход за 2 года / 730), но с собственными, отдельными границами -
 * минимум и максимум для этого пособия не совпадают с минимумом/максимумом СДЗ больничных.
 */
export function calculateChildCareAllowance(income2Years: number): ChildCareAllowanceCalculation {
  const sdz = income2Years / 730;
  const rawMonthlyAllowance = sdz * AVERAGE_DAYS_PER_MONTH * CHILD_CARE_RATE;

  let monthlyAllowance = rawMonthlyAllowance;
  let cappedByMax = false;
  let raisedToMin = false;

  if (monthlyAllowance > MAX_CHILD_CARE_ALLOWANCE_2026) {
    monthlyAllowance = MAX_CHILD_CARE_ALLOWANCE_2026;
    cappedByMax = true;
  } else if (monthlyAllowance < MIN_CHILD_CARE_ALLOWANCE_2026) {
    monthlyAllowance = MIN_CHILD_CARE_ALLOWANCE_2026;
    raisedToMin = true;
  }

  return { sdz, rawMonthlyAllowance, monthlyAllowance, cappedByMax, raisedToMin };
}
