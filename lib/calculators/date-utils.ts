const MONTHS_PER_YEAR = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Количество полных месяцев между двумя датами - без ограничения сверху. Месяц округляется в
 * бо́льшую сторону при 15+ днях сверх последнего полного месяца, иначе не учитывается (то же
 * правило "15+ дней = месяц", что используется при ручном вводе в нескольких калькуляторах сайта).
 */
export function calculateFullMonthsBetweenDates(start: Date, end: Date): number {
  let months =
    (end.getFullYear() - start.getFullYear()) * MONTHS_PER_YEAR +
    (end.getMonth() - start.getMonth());
  let monthMark = new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
  if (monthMark > end) {
    months -= 1;
    monthMark = new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
  }

  const remainderDays = Math.round((end.getTime() - monthMark.getTime()) / DAY_MS);
  if (remainderDays >= 15) months += 1;

  return Math.max(months, 0);
}

/** Прибавляет к дате указанное количество календарных дней. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Прибавляет к дате указанное количество месяцев (сохраняя день месяца, где это возможно). */
export function addMonths(date: Date, months: number): Date {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + months;
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(targetYear, targetMonth, Math.min(date.getDate(), lastDayOfTargetMonth));
}
