/**
 * Скидка на оплату штрафа за нарушение ПДД (ч. 1.3 ст. 32.2 КоАП РФ). С 01.01.2025 (Федеральный
 * закон от 26.12.2024 № 490-ФЗ) размер скидки снижен с прежних 50% до 25%, а срок увеличен с 20
 * до 30 дней. Прежние условия (50%/20 дней) действуют только для нарушений, совершённых до
 * 01.01.2025, - в 2026 году актуальны только новые.
 */
export const DISCOUNT_RATE = 0.25;
export const DISCOUNT_WINDOW_DAYS = 30;

export type FineCalculation = {
  discountEligible: boolean;
  amountDue: number;
  discountAmount: number;
  daysLeft: number;
};

export function calculateFineWithDiscount(
  fineAmount: number,
  daysSinceIssued: number,
  isExcludedViolation: boolean,
): FineCalculation {
  const withinWindow = daysSinceIssued <= DISCOUNT_WINDOW_DAYS;
  const discountEligible = withinWindow && !isExcludedViolation;

  const amountDue = discountEligible ? fineAmount * (1 - DISCOUNT_RATE) : fineAmount;
  const discountAmount = fineAmount - amountDue;
  const daysLeft = Math.max(DISCOUNT_WINDOW_DAYS - daysSinceIssued, 0);

  return { discountEligible, amountDue, discountAmount, daysLeft };
}
