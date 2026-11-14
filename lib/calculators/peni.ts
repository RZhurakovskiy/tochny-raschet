import { UTILITY_PENALTY_KEY_RATE_CAP } from "@/lib/calculators/constants";

/** Пеня по налогам для физлиц: 1/300 ключевой ставки за весь период просрочки (ст. 75 НК РФ). */
export function calculateTaxPenalty(debt: number, daysOverdue: number, keyRate: number): number {
  return debt * (keyRate / 300) * daysOverdue;
}

/** Для ЖКХ до 01.01.2027 берётся меньшая из текущей ставки ЦБ и 9,5% (ПП РФ № 329). */
export function effectiveUtilityKeyRate(keyRate: number): number {
  return Math.min(keyRate, UTILITY_PENALTY_KEY_RATE_CAP);
}

export type UtilityPenaltyCalculation = {
  daysAtOneThreeHundredth: number;
  daysAtOneHundredThirtieth: number;
  penaltyAtOneThreeHundredth: number;
  penaltyAtOneHundredThirtieth: number;
  totalPenalty: number;
  effectiveKeyRate: number;
  rateCapped: boolean;
};

/**
 * Пеня по ЖКХ (ст. 155 ЖК РФ): первые 30 дней просрочки — без пени, с 31-го по 90-й день —
 * 1/300 ключевой ставки за день, с 91-го дня — 1/130 ключевой ставки за день.
 * Ставка ограничена потолком 9,5% до 01.01.2027 (ПП РФ от 18.03.2025 № 329).
 */
export function calculateUtilityPenalty(
  debt: number,
  daysOverdue: number,
  keyRate: number,
): UtilityPenaltyCalculation {
  const effectiveKeyRate = effectiveUtilityKeyRate(keyRate);
  const daysAtOneThreeHundredth = Math.max(Math.min(daysOverdue, 90) - 30, 0);
  const daysAtOneHundredThirtieth = Math.max(daysOverdue - 90, 0);

  const penaltyAtOneThreeHundredth = debt * (effectiveKeyRate / 300) * daysAtOneThreeHundredth;
  const penaltyAtOneHundredThirtieth = debt * (effectiveKeyRate / 130) * daysAtOneHundredThirtieth;

  return {
    daysAtOneThreeHundredth,
    daysAtOneHundredThirtieth,
    penaltyAtOneThreeHundredth,
    penaltyAtOneHundredThirtieth,
    totalPenalty: penaltyAtOneThreeHundredth + penaltyAtOneHundredThirtieth,
    effectiveKeyRate,
    rateCapped: effectiveKeyRate < keyRate,
  };
}
