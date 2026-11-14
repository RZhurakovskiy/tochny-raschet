import { calculateAverageDailyEarnings } from "@/lib/calculators/otpusknye";

const STANDARD_ANNUAL_LEAVE_DAYS = 28;
const MONTHS_PER_YEAR = 12;

/** ≈2,33 дня отпуска "накапливается" за каждый полный отработанный месяц (28 / 12). */
export const VACATION_DAYS_PER_MONTH = STANDARD_ANNUAL_LEAVE_DAYS / MONTHS_PER_YEAR;

export function calculateCompensationDays(
  fullMonthsWorked: number,
  usedVacationDays: number,
): number {
  const earned = VACATION_DAYS_PER_MONTH * fullMonthsWorked;
  return Math.max(earned - usedVacationDays, 0);
}

export function calculateVacationCompensation(
  income12Months: number,
  fullMonthsWorked: number,
  usedVacationDays: number,
) {
  const sdz = calculateAverageDailyEarnings(income12Months);
  const days = calculateCompensationDays(fullMonthsWorked, usedVacationDays);
  return { sdz, days, gross: sdz * days };
}
