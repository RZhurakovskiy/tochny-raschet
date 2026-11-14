import { calculateClampedSdz } from "@/lib/calculators/sdz";
import { getSickLeavePaymentRate } from "@/lib/calculators/bolnichnyy";

export type ChildAgeGroup = "under8" | "8to15" | "15to18";
export type TreatmentSetting = "outpatient" | "inpatient";

/**
 * Лимит оплачиваемых дней ухода за ребёнком в календарном году (ч. 5 ст. 6 закона № 255-ФЗ).
 * Упрощённая модель MVP: не учитывает +90 дней для заболеваний из спецперечня Минздрава
 * и лимит "15 дней по каждому случаю" внутри годового лимита для группы 8-15 лет.
 */
export const CHILD_CARE_ANNUAL_DAY_LIMIT: Record<ChildAgeGroup, number> = {
  under8: 60,
  "8to15": 45,
  "15to18": 30,
};

/** Дней амбулаторного лечения ребёнка 8-15 лет, оплачиваемых по проценту стажа - дальше 50%. */
export const FULL_RATE_OUTPATIENT_DAYS = 10;

export type ChildCareSickLeaveCalculation = {
  rawSdz: number;
  sdz: number;
  cappedByMax: boolean;
  raisedToMin: boolean;
  rate: number;
  fullRateDays: number;
  reducedRateDays: number;
  benefit: number;
};

/**
 * Пособие по больничному по уходу за ребёнком (ст. 6-7 закона № 255-ФЗ). В отличие от
 * больничного по собственной болезни, здесь на процент оплаты влияет ещё возраст ребёнка:
 * младше 8 лет - всегда 100% независимо от стажа; 8 лет и старше - по стажу, а при амбулаторном
 * лечении (кроме группы 15-18 лет, для которой это единственный вариант) первые 10 дней - по
 * стажу, остальные - 50% среднего заработка.
 */
export function calculateChildCareSickLeaveBenefit(
  income2Years: number,
  insuranceYears: number,
  days: number,
  childAge: ChildAgeGroup,
  treatmentSetting: TreatmentSetting,
): ChildCareSickLeaveCalculation {
  const { rawSdz, sdz, cappedByMax, raisedToMin } = calculateClampedSdz(income2Years);

  if (childAge === "under8") {
    return {
      rawSdz,
      sdz,
      cappedByMax,
      raisedToMin,
      rate: 1,
      fullRateDays: days,
      reducedRateDays: 0,
      benefit: sdz * days,
    };
  }

  const rate = getSickLeavePaymentRate(insuranceYears);

  if (childAge === "8to15" && treatmentSetting === "outpatient") {
    const fullRateDays = Math.min(days, FULL_RATE_OUTPATIENT_DAYS);
    const reducedRateDays = Math.max(days - FULL_RATE_OUTPATIENT_DAYS, 0);
    const benefit = sdz * rate * fullRateDays + sdz * 0.5 * reducedRateDays;
    return { rawSdz, sdz, cappedByMax, raisedToMin, rate, fullRateDays, reducedRateDays, benefit };
  }

  return {
    rawSdz,
    sdz,
    cappedByMax,
    raisedToMin,
    rate,
    fullRateDays: days,
    reducedRateDays: 0,
    benefit: sdz * rate * days,
  };
}
