import { calculateAnnualNdfl } from "@/lib/calculators/ndfl";
import { MORTGAGE_INTEREST_DEDUCTION_LIMIT } from "@/lib/calculators/constants";

export function calculateMonthlyRate(annualRatePercent: number): number {
  return annualRatePercent / 12 / 100;
}

/**
 * Аннуитетный платёж: A = P × r / (1 - (1 + r)^-n). При r = 0 (теоретический случай, у реальной
 * ипотеки такого не бывает) вырождается в равномерное деление основного долга на срок.
 */
export function calculateAnnuityPayment(
  principal: number,
  monthlyRate: number,
  months: number,
): number {
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

/**
 * Обратная задача: сколько месяцев нужно, чтобы конкретным платежом погасить остаток долга.
 * Получено обращением формулы аннуитета относительно n. Используется в сценарии "уменьшить срок"
 * при досрочном погашении - платёж остаётся прежним, размер долга уменьшился.
 */
export function calculateMonthsToPayOff(
  principal: number,
  monthlyRate: number,
  payment: number,
): number {
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return Math.ceil(principal / payment);
  const ratio = 1 - (principal * monthlyRate) / payment;
  // Платежа не хватает даже на проценты - долг не сократится никогда. На практике не должно
  // происходить (payment всегда рассчитан на больший или равный остаток долга), но проверяем.
  if (ratio <= 0) return Infinity;
  return Math.ceil(-Math.log(ratio) / Math.log(1 + monthlyRate));
}

export type MortgageBaseCalculation = {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  /** Сколько из ближайшего платежа сейчас уходит на проценты, а сколько - на тело долга. */
  currentInterestPart: number;
  currentPrincipalPart: number;
};

export function calculateMortgageBase(
  remainingBalance: number,
  annualRatePercent: number,
  remainingMonths: number,
): MortgageBaseCalculation {
  const monthlyRate = calculateMonthlyRate(annualRatePercent);
  const monthlyPayment = calculateAnnuityPayment(remainingBalance, monthlyRate, remainingMonths);
  const totalPaid = monthlyPayment * remainingMonths;
  const totalInterest = totalPaid - remainingBalance;
  const currentInterestPart = remainingBalance * monthlyRate;
  const currentPrincipalPart = monthlyPayment - currentInterestPart;

  return {
    monthlyPayment,
    totalPaid,
    totalInterest,
    currentInterestPart,
    currentPrincipalPart,
  };
}

export type ExtraPaymentStrategy = "reduceTerm" | "reducePayment";

export type ExtraPaymentSimulation = {
  strategy: ExtraPaymentStrategy;
  newPrincipal: number;
  newMonths: number;
  newMonthlyPayment: number;
  monthsSaved: number;
  totalInterestNew: number;
  interestSaved: number;
  /** Долг погашен полностью самой доплатой, дальнейшие платежи не нужны. */
  payoffComplete: boolean;
};

/**
 * Симулирует разовую доплату сейчас поверх текущего графика. Два способа распорядиться
 * освободившимся "запасом" в графике - оставить прежний платёж и сократить срок (`reduceTerm`,
 * экономит больше на процентах) или оставить прежний срок и снизить платёж (`reducePayment`,
 * освобождает деньги в моменте). Комиссии/штрафов банка за досрочное погашение нет по закону
 * (ст. 810, 819 ГК РФ - можно погашать досрочно без штрафов), поэтому в расчёте не учитываются.
 */
export function simulateExtraPayment(
  remainingBalance: number,
  annualRatePercent: number,
  remainingMonths: number,
  extraPayment: number,
  strategy: ExtraPaymentStrategy,
): ExtraPaymentSimulation {
  const monthlyRate = calculateMonthlyRate(annualRatePercent);
  const originalPayment = calculateAnnuityPayment(remainingBalance, monthlyRate, remainingMonths);
  const originalTotalInterest = originalPayment * remainingMonths - remainingBalance;

  const newPrincipal = Math.max(remainingBalance - extraPayment, 0);

  if (newPrincipal === 0) {
    return {
      strategy,
      newPrincipal: 0,
      newMonths: 0,
      newMonthlyPayment: 0,
      monthsSaved: remainingMonths,
      totalInterestNew: 0,
      interestSaved: originalTotalInterest,
      payoffComplete: true,
    };
  }

  if (strategy === "reduceTerm") {
    const newMonths = calculateMonthsToPayOff(newPrincipal, monthlyRate, originalPayment);
    const totalInterestNew = originalPayment * newMonths - newPrincipal;
    return {
      strategy,
      newPrincipal,
      newMonths,
      newMonthlyPayment: originalPayment,
      monthsSaved: remainingMonths - newMonths,
      totalInterestNew,
      interestSaved: originalTotalInterest - totalInterestNew,
      payoffComplete: false,
    };
  }

  const newMonthlyPayment = calculateAnnuityPayment(newPrincipal, monthlyRate, remainingMonths);
  const totalInterestNew = newMonthlyPayment * remainingMonths - newPrincipal;
  return {
    strategy,
    newPrincipal,
    newMonths: remainingMonths,
    newMonthlyPayment,
    monthsSaved: 0,
    totalInterestNew,
    interestSaved: originalTotalInterest - totalInterestNew,
    payoffComplete: false,
  };
}

const MAX_DEDUCTION_YEARS = 60;

export type SpouseDeductionResult = {
  /** Доля процентов, приходящаяся на этого супруга, по выбранному разделу. */
  interestShare: number;
  /** Сколько из доли реально попадает под вычет - не больше лимита 3 000 000 ₽ на человека. */
  claimableInterest: number;
  /** Часть доли сверх лимита - вычетом не покрывается, деньги "сгорают". */
  wastedInterest: number;
  /** За сколько лет получится выбрать вычет целиком при текущем доходе. */
  years: number;
  /** Сколько всего вернётся за все эти годы. */
  totalRefund: number;
};

/**
 * Считает, за сколько лет и на какую сумму конкретный супруг выберет свою долю вычета по
 * ипотечным процентам, если каждый год заявляет вычет по максимуму (весь доход года, пока не
 * исчерпает лимит). Возврат за каждый год - реальная экономия на прогрессивной шкале НДФЛ
 * (calculateAnnualNdfl), а не плоские 13% - так вычет считается корректно и для высоких доходов,
 * попадающих в повышенные ставки шкалы 2026 года.
 */
export function calculateDeductionForSpouse(
  interestShare: number,
  annualIncome: number,
): SpouseDeductionResult {
  const claimableInterest = Math.min(interestShare, MORTGAGE_INTEREST_DEDUCTION_LIMIT);
  const wastedInterest = Math.max(interestShare - MORTGAGE_INTEREST_DEDUCTION_LIMIT, 0);

  if (annualIncome <= 0 || claimableInterest <= 0) {
    return { interestShare, claimableInterest, wastedInterest, years: 0, totalRefund: 0 };
  }

  let remaining = claimableInterest;
  let years = 0;
  let totalRefund = 0;
  const taxWithoutDeduction = calculateAnnualNdfl(annualIncome).totalTax;

  while (remaining > 0.01 && years < MAX_DEDUCTION_YEARS) {
    const claimThisYear = Math.min(remaining, annualIncome);
    const taxWithDeduction = calculateAnnualNdfl(annualIncome - claimThisYear).totalTax;
    totalRefund += taxWithoutDeduction - taxWithDeduction;
    remaining -= claimThisYear;
    years += 1;
  }

  return { interestShare, claimableInterest, wastedInterest, years, totalRefund };
}

export type DeductionSplitResult = {
  spouseA: SpouseDeductionResult;
  spouseB: SpouseDeductionResult;
};

/** Делит общую сумму процентов между двумя супругами по проценту `splitPercentA` (доля первого). */
export function calculateDeductionSplit(
  totalInterest: number,
  splitPercentA: number,
  annualIncomeA: number,
  annualIncomeB: number,
): DeductionSplitResult {
  const interestShareA = totalInterest * (splitPercentA / 100);
  const interestShareB = totalInterest - interestShareA;

  return {
    spouseA: calculateDeductionForSpouse(interestShareA, annualIncomeA),
    spouseB: calculateDeductionForSpouse(interestShareB, annualIncomeB),
  };
}
