import { MAX_SICK_LEAVE_SDZ_2026, MIN_SICK_LEAVE_SDZ_2026 } from "@/lib/calculators/constants";

export type ClampedSdz = {
  rawSdz: number;
  sdz: number;
  cappedByMax: boolean;
  raisedToMin: boolean;
};

/**
 * Средний дневной заработок с учётом минимума (из МРОТ) и максимума (из предельных баз СФР) —
 * общее правило для больничных и пособия по беременности и родам (ст. 14 закона № 255-ФЗ).
 */
export function calculateClampedSdz(income2Years: number): ClampedSdz {
  const rawSdz = income2Years / 730;
  let sdz = rawSdz;
  let cappedByMax = false;
  let raisedToMin = false;

  if (sdz > MAX_SICK_LEAVE_SDZ_2026) {
    sdz = MAX_SICK_LEAVE_SDZ_2026;
    cappedByMax = true;
  } else if (sdz < MIN_SICK_LEAVE_SDZ_2026) {
    sdz = MIN_SICK_LEAVE_SDZ_2026;
    raisedToMin = true;
  }

  return { rawSdz, sdz, cappedByMax, raisedToMin };
}
