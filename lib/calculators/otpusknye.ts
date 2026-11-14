import { AVERAGE_MONTHLY_DAYS } from "@/lib/calculators/constants";

export function calculateAverageDailyEarnings(income12Months: number): number {
  return income12Months / 12 / AVERAGE_MONTHLY_DAYS;
}

export function calculateVacationPay(income12Months: number, vacationDays: number) {
  const sdz = calculateAverageDailyEarnings(income12Months);
  return { sdz, gross: sdz * vacationDays };
}

/**
 * Скорректированное количество дней расчётного периода с учётом одного неполного месяца
 * (например, отпуск без содержания часть месяца). См. п. 12(1) Положения № 540.
 */
export function calculateAdjustedPeriodDays(
  fullMonths: number,
  calendarDaysInIncompleteMonth: number,
  workedDaysInIncompleteMonth: number,
): number {
  return (
    AVERAGE_MONTHLY_DAYS * fullMonths +
    (AVERAGE_MONTHLY_DAYS / calendarDaysInIncompleteMonth) * workedDaysInIncompleteMonth
  );
}

export function calculateVacationPayWithIncompleteMonth(
  income12Months: number,
  fullMonths: number,
  calendarDaysInIncompleteMonth: number,
  workedDaysInIncompleteMonth: number,
  vacationDays: number,
) {
  const periodDays = calculateAdjustedPeriodDays(
    fullMonths,
    calendarDaysInIncompleteMonth,
    workedDaysInIncompleteMonth,
  );
  const sdz = income12Months / periodDays;
  return { sdz, gross: sdz * vacationDays, periodDays };
}
