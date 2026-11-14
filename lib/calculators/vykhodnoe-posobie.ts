const MONTHS_PER_YEAR = 12;

/**
 * Максимум месяцев, за которые сохраняется средний заработок при сокращении штата или
 * ликвидации организации (ст. 178 ТК РФ) для обычных регионов - для районов Крайнего Севера и
 * приравненных местностей срок больше (ст. 318 ТК РФ), в MVP не учитывается.
 */
export const MAX_SEVERANCE_MONTHS = 3;

export type SeveranceCalculation = {
  /** Средний месячный заработок - упрощённо, доход за 12 месяцев / 12 (без учёта фактических
   * отработанных рабочих дней, как того требует точная методика по ПП РФ № 922). */
  avgMonthlyIncome: number;
  monthsPaid: number;
  benefit: number;
};

/**
 * Пособие при увольнении по сокращению штата или ликвидации организации: средний месячный
 * заработок выплачивается за 1-й месяц всегда, за 2-й - если бывший сотрудник не трудоустроился,
 * за 3-й - только по решению службы занятости (при том же условии за 2-й месяц).
 */
export function calculateSeveranceBenefit(
  income12Months: number,
  month2Paid: boolean,
  month3Paid: boolean,
): SeveranceCalculation {
  const avgMonthlyIncome = income12Months / MONTHS_PER_YEAR;
  const monthsPaid = 1 + (month2Paid ? 1 : 0) + (month3Paid ? 1 : 0);
  return { avgMonthlyIncome, monthsPaid, benefit: avgMonthlyIncome * monthsPaid };
}
