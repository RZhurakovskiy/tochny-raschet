import { NDFL_BRACKETS_2026 } from "@/lib/calculators/constants";

export type GrossFromNetCalculation = {
  targetNetAnnual: number;
  requiredGrossAnnual: number;
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
  /** Нижняя граница найденного диапазона шкалы (по валовому доходу) - для пошагового разбора. */
  bracketFromGross: number;
  /** Сумма "на руки", накопленная до нижней границы найденного диапазона - для пошагового разбора. */
  netAtBracketStart: number;
};

/**
 * Обратная задача к прогрессивной шкале НДФЛ: по желаемой сумме "на руки" находит нужный оклад
 * до вычета налога. net(gross) кусочно-линейна и монотонно возрастает (ставка налога всегда
 * меньше 100%), поэтому каждый диапазон шкалы обращается аналитически, без итеративного подбора.
 */
export function calculateGrossFromNet(targetNetAnnual: number): GrossFromNetCalculation {
  const target = Math.max(targetNetAnnual, 0);
  let previousThreshold = 0;
  let previousNet = 0;

  for (const bracket of NDFL_BRACKETS_2026) {
    const bracketSize = bracket.upTo - previousThreshold;
    const netAtBracketEnd = previousNet + bracketSize * (1 - bracket.rate);

    if (target <= netAtBracketEnd) {
      const requiredGrossAnnual = previousThreshold + (target - previousNet) / (1 - bracket.rate);
      const totalTax = requiredGrossAnnual - target;
      return {
        targetNetAnnual: target,
        requiredGrossAnnual,
        totalTax,
        effectiveRate: requiredGrossAnnual > 0 ? totalTax / requiredGrossAnnual : 0,
        marginalRate: bracket.rate,
        bracketFromGross: previousThreshold,
        netAtBracketStart: previousNet,
      };
    }

    previousThreshold = bracket.upTo;
    previousNet = netAtBracketEnd;
  }

  // Недостижимо: последний диапазон NDFL_BRACKETS_2026 имеет upTo = Infinity, условие выше
  // сработает раньше, чем цикл закончится.
  throw new Error("Не удалось определить диапазон шкалы НДФЛ для заданной суммы на руки");
}
