import {
  ENFORCEMENT_FEE_RATE_2026,
  ENFORCEMENT_FEE_MIN_MONEY_2026,
  ENFORCEMENT_FEE_FIXED_NON_MONEY_2026,
  ENFORCEMENT_FEE_MAX_COURT_REDUCTION,
} from "@/lib/calculators/constants";

export type DebtorType = "individual" | "legalEntity";

export type MoneyEnforcementFeeCalculation = {
  rawFee: number;
  minFee: number;
  fee: number;
  flooredByMin: boolean;
  feeAfterMaxCourtReduction: number;
};

/** Исполнительский сбор по денежным (имущественным) требованиям - 12% от долга, но не менее минимума (ч. 1, 3 ст. 112 229-ФЗ). */
export function calculateMoneyEnforcementFee(
  debt: number,
  debtorType: DebtorType,
): MoneyEnforcementFeeCalculation {
  const rawFee = debt * ENFORCEMENT_FEE_RATE_2026;
  const minFee = ENFORCEMENT_FEE_MIN_MONEY_2026[debtorType];
  const fee = Math.max(rawFee, minFee);
  return {
    rawFee,
    minFee,
    fee,
    flooredByMin: fee > rawFee,
    feeAfterMaxCourtReduction: fee * (1 - ENFORCEMENT_FEE_MAX_COURT_REDUCTION),
  };
}

export type NonMoneyEnforcementFeeCalculation = {
  fee: number;
  feeAfterMaxCourtReduction: number;
};

/** Исполнительский сбор по неимущественным требованиям - фиксированная сумма, не зависит от долга (ч. 3 ст. 112 229-ФЗ). */
export function calculateNonMoneyEnforcementFee(
  debtorType: DebtorType,
): NonMoneyEnforcementFeeCalculation {
  const fee = ENFORCEMENT_FEE_FIXED_NON_MONEY_2026[debtorType];
  return {
    fee,
    feeAfterMaxCourtReduction: fee * (1 - ENFORCEMENT_FEE_MAX_COURT_REDUCTION),
  };
}
