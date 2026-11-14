import { calculateAnnualNdfl } from "@/lib/calculators/ndfl";

export type ChildrenCount = "one" | "two" | "threeOrMore";

/** Доли по ст. 81 СК РФ при отсутствии соглашения об уплате алиментов. */
export const ALIMONY_SHARE: Record<ChildrenCount, number> = {
  one: 1 / 4,
  two: 1 / 3,
  threeOrMore: 1 / 2,
};

export type AlimonyCalculation = {
  monthlyNetIncome: number;
  alimony: number;
};

/**
 * Алименты рассчитываются от дохода за вычетом НДФЛ - так его удерживает бухгалтерия по
 * исполнительному листу (доля от "чистой" зарплаты, а не от суммы до налога).
 */
export function calculateAlimony(
  monthlyGrossIncome: number,
  childrenCount: ChildrenCount,
): AlimonyCalculation {
  const annualGross = monthlyGrossIncome * 12;
  const { netAnnualIncome } = calculateAnnualNdfl(annualGross);
  const monthlyNetIncome = netAnnualIncome / 12;
  const alimony = monthlyNetIncome * ALIMONY_SHARE[childrenCount];

  return { monthlyNetIncome, alimony };
}
