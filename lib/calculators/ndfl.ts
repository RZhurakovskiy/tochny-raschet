import { NDFL_BRACKETS_2026 } from "@/lib/calculators/constants";

export type NdflBracketSegment = {
  rate: number;
  from: number;
  to: number;
  taxableAmount: number;
  tax: number;
};

export type NdflCalculation = {
  annualIncome: number;
  segments: NdflBracketSegment[];
  totalTax: number;
  netAnnualIncome: number;
};

/**
 * Считает НДФЛ по прогрессивной шкале 2026 года нарастающим итогом: повышенная ставка
 * применяется только к сумме превышения порога, а не ко всему доходу.
 */
export function calculateAnnualNdfl(annualIncome: number): NdflCalculation {
  let remaining = Math.max(annualIncome, 0);
  let previousThreshold = 0;
  const segments: NdflBracketSegment[] = [];
  let totalTax = 0;

  for (const bracket of NDFL_BRACKETS_2026) {
    if (remaining <= 0) break;
    const bracketSize = bracket.upTo - previousThreshold;
    const taxableAmount = Math.min(remaining, bracketSize);

    if (taxableAmount > 0) {
      const tax = taxableAmount * bracket.rate;
      segments.push({
        rate: bracket.rate,
        from: previousThreshold,
        to: previousThreshold + taxableAmount,
        taxableAmount,
        tax,
      });
      totalTax += tax;
      remaining -= taxableAmount;
    }

    previousThreshold = bracket.upTo;
  }

  return {
    annualIncome,
    segments,
    totalTax,
    netAnnualIncome: annualIncome - totalTax,
  };
}
