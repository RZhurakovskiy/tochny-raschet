import { calculateClampedSdz } from "@/lib/calculators/sdz";

export type MaternityLeaveType = "standard" | "complicated" | "multiple";

/** Дни отпуска по беременности и родам по ст. 10 закона № 255-ФЗ (70+70 / 70+86 / 84+110). */
export const MATERNITY_LEAVE_DAYS: Record<MaternityLeaveType, number> = {
  standard: 140,
  complicated: 156,
  multiple: 194,
};

/**
 * Часть дней отпуска по БиР, которая приходится на период ПОСЛЕ родов - именно с этого момента,
 * а не с даты родов, начинается отпуск по уходу за ребёнком (он не может идти параллельно с
 * отпуском по БиР).
 */
export const MATERNITY_LEAVE_DAYS_AFTER_BIRTH: Record<MaternityLeaveType, number> = {
  standard: 70,
  complicated: 86,
  multiple: 110,
};

export type MaternityBenefitCalculation = {
  rawSdz: number;
  sdz: number;
  cappedByMax: boolean;
  raisedToMin: boolean;
  days: number;
  benefit: number;
};

export function calculateMaternityBenefit(
  income2Years: number,
  leaveType: MaternityLeaveType,
): MaternityBenefitCalculation {
  const { rawSdz, sdz, cappedByMax, raisedToMin } = calculateClampedSdz(income2Years);
  const days = MATERNITY_LEAVE_DAYS[leaveType];
  const benefit = sdz * days;

  return { rawSdz, sdz, cappedByMax, raisedToMin, days, benefit };
}
