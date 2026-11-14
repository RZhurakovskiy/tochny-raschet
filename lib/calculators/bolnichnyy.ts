import { SICK_LEAVE_PAYMENT_RATE_BY_EXPERIENCE } from "@/lib/calculators/constants";
import { calculateClampedSdz } from "@/lib/calculators/sdz";

export function getSickLeavePaymentRate(insuranceYears: number): number {
  const bracket = SICK_LEAVE_PAYMENT_RATE_BY_EXPERIENCE.find(
    (item) => insuranceYears >= item.minYears,
  );
  return bracket?.rate ?? 0.6;
}

export type SickLeaveCalculation = {
  rawSdz: number;
  sdz: number;
  cappedByMax: boolean;
  raisedToMin: boolean;
  rate: number;
  benefit: number;
};

export function calculateSickLeaveBenefit(
  income2Years: number,
  insuranceYears: number,
  days: number,
): SickLeaveCalculation {
  const { rawSdz, sdz, cappedByMax, raisedToMin } = calculateClampedSdz(income2Years);
  const rate = getSickLeavePaymentRate(insuranceYears);
  const benefit = sdz * rate * days;

  return { rawSdz, sdz, cappedByMax, raisedToMin, rate, benefit };
}
