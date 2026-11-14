"use client";

import { Calculator, type CalculationResult, type CalculatorValues } from "@/components/Calculator";
import {
  calculateFineWithDiscount,
  DISCOUNT_RATE,
  DISCOUNT_WINDOW_DAYS,
} from "@/lib/calculators/shtraf-gibdd";
import { formatCurrency } from "@/lib/format";

function calculate(values: CalculatorValues): CalculationResult {
  const fineAmount = Number(values.fineAmount);
  const daysSinceIssued = Number(values.daysSinceIssued);
  const isExcludedViolation = Boolean(values.isExcludedViolation);

  if (fineAmount <= 0) return { ok: false, error: "Сумма штрафа должна быть больше нуля" };
  if (daysSinceIssued < 0)
    return { ok: false, error: "Количество дней не может быть отрицательным" };

  const { discountEligible, amountDue, discountAmount, daysLeft } = calculateFineWithDiscount(
    fineAmount,
    daysSinceIssued,
    isExcludedViolation,
  );

  if (isExcludedViolation) {
    return {
      ok: true,
      lines: [
        {
          label: "Скидка не действует",
          value: formatCurrency(amountDue),
          hint: "Это нарушение входит в список исключений ч. 1.3 ст. 32.2 КоАП РФ - оплата в полном размере",
          emphasis: true,
        },
      ],
    };
  }

  if (!discountEligible) {
    return {
      ok: true,
      lines: [
        {
          label: "Срок скидки истёк",
          value: formatCurrency(amountDue),
          hint: `30-дневный срок скидки закончился ${daysSinceIssued - DISCOUNT_WINDOW_DAYS} дн. назад - оплата в полном размере`,
          emphasis: true,
        },
      ],
    };
  }

  return {
    ok: true,
    lines: [
      { label: "Скидка", value: `${DISCOUNT_RATE * 100}%`, hint: `Действует ещё ${daysLeft} дн.` },
      { label: "Сумма скидки", value: formatCurrency(discountAmount) },
      { label: "К оплате со скидкой", value: formatCurrency(amountDue), emphasis: true },
    ],
  };
}

export function ShtrafGibddCalculatorForm() {
  return (
    <Calculator
      resultCardTitle="Штраф ГИБДД со скидкой"
      fields={[
        {
          id: "fineAmount",
          type: "number",
          label: "Сумма штрафа по постановлению",
          unit: "₽",
          min: 0,
          placeholder: "Например, 1000",
        },
        {
          id: "daysSinceIssued",
          type: "number",
          label: "Дней с даты вынесения постановления",
          unit: "дней",
          min: 0,
          max: 365,
          placeholder: "Например, 10",
          hint: "Не с даты, когда узнали о штрафе, а с даты вынесения постановления (обычно указана в самом постановлении)",
        },
        {
          id: "isExcludedViolation",
          type: "checkbox",
          label: "Это одно из нарушений без скидки (см. подсказку ниже)",
          hint: "Нетрезвое вождение или отказ от медосвидетельствования, вред здоровью или оставление места ДТП, повторное грубое нарушение (превышение скорости на 40+ км/ч, проезд на красный, выезд на встречку). Для нетрезвого вождения это не единственное последствие - см. текст на странице про лишение прав",
        },
      ]}
      calculate={calculate}
    />
  );
}
