"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calculator,
  type BreakdownStep,
  type CalculationResult,
  type CalculatorValues,
  type ResultLine,
} from "@/components/Calculator";
import {
  calculateTaxPenalty,
  calculateUtilityPenalty,
  type UtilityPenaltyCalculation,
} from "@/lib/calculators/peni";
import { CBR_KEY_RATE_2026, UTILITY_PENALTY_KEY_RATE_CAP } from "@/lib/calculators/constants";
import { formatCurrency } from "@/lib/format";

/** Пошаговый разбор пени по ЖКХ - для блока "Показать расчёт по шагам" (налоговый режим проще, без него). */
function buildUtilityBreakdown(debt: number, result: UtilityPenaltyCalculation): BreakdownStep[] {
  const {
    daysAtOneThreeHundredth,
    daysAtOneHundredThirtieth,
    penaltyAtOneThreeHundredth,
    penaltyAtOneHundredThirtieth,
    totalPenalty,
    effectiveKeyRate,
    rateCapped,
  } = result;

  const steps: BreakdownStep[] = [
    {
      label: "Ставка для расчёта",
      result: `${(effectiveKeyRate * 100).toFixed(2)}%`,
      note: rateCapped ? "Применён потолок 9,5% (действует до 01.01.2027)" : undefined,
      lawLabel: "ст. 155 ЖК РФ",
      lawHref: "https://pravo.ppt.ru/kodeks/zhk/st-155",
    },
  ];

  if (daysAtOneThreeHundredth > 0) {
    steps.push({
      label: `31-90 день (1/300 ставки): ${daysAtOneThreeHundredth} дн.`,
      formula: `${formatCurrency(debt)} × ${(effectiveKeyRate * 100).toFixed(2)}% / 300 × ${daysAtOneThreeHundredth}`,
      result: formatCurrency(penaltyAtOneThreeHundredth),
    });
  }

  if (daysAtOneHundredThirtieth > 0) {
    steps.push({
      label: `С 91-го дня (1/130 ставки): ${daysAtOneHundredThirtieth} дн.`,
      formula: `${formatCurrency(debt)} × ${(effectiveKeyRate * 100).toFixed(2)}% / 130 × ${daysAtOneHundredThirtieth}`,
      result: formatCurrency(penaltyAtOneHundredThirtieth),
    });
  }

  steps.push({
    label: "Итого пеня",
    formula:
      daysAtOneHundredThirtieth > 0
        ? `${formatCurrency(penaltyAtOneThreeHundredth)} + ${formatCurrency(penaltyAtOneHundredThirtieth)}`
        : undefined,
    result: formatCurrency(totalPenalty),
  });

  return steps;
}

// Math.round убирает погрешность плавающей точки (0.14 * 100 === 14.000000000000002 в JS).
const DEFAULT_KEY_RATE_PERCENT = Math.round(CBR_KEY_RATE_2026 * 10000) / 100;
const UTILITY_CAP_PERCENT = Math.round(UTILITY_PENALTY_KEY_RATE_CAP * 10000) / 100;

const rateField = {
  id: "keyRatePercent",
  type: "number" as const,
  label: "Ключевая ставка ЦБ",
  unit: "%",
  min: 0,
  max: 50,
  defaultValue: DEFAULT_KEY_RATE_PERCENT,
  hint: "Предзаполнено значение с 27.07.2026 (14%) — сверьтесь на cbr.ru, если считаете позже",
};

const debtField = {
  id: "debt",
  type: "number" as const,
  label: "Сумма долга",
  unit: "₽",
  min: 0,
  placeholder: "Например, 15000",
};

const daysField = {
  id: "days",
  type: "number" as const,
  label: "Количество дней просрочки",
  unit: "дней",
  min: 1,
  max: 3650,
  placeholder: "Например, 45",
};

function taxCalculate(values: CalculatorValues): CalculationResult {
  const debt = Number(values.debt);
  const days = Number(values.days);
  const keyRate = Number(values.keyRatePercent) / 100;

  if (debt <= 0) return { ok: false, error: "Сумма долга должна быть больше нуля" };
  if (days <= 0) return { ok: false, error: "Количество дней просрочки должно быть больше нуля" };

  const penalty = calculateTaxPenalty(debt, days, keyRate);

  return {
    ok: true,
    lines: [
      {
        label: "Дневная ставка пени",
        value: `${((keyRate / 300) * 100).toFixed(4)}%`,
        hint: "1/300 ключевой ставки ЦБ - для физлиц не зависит от длительности просрочки",
      },
      { label: "Пеня к уплате", value: formatCurrency(penalty), emphasis: true },
    ],
  };
}

function utilityCalculate(values: CalculatorValues): CalculationResult {
  const debt = Number(values.debt);
  const days = Number(values.days);
  const keyRate = Number(values.keyRatePercent) / 100;

  if (debt <= 0) return { ok: false, error: "Сумма долга должна быть больше нуля" };
  if (days <= 0) return { ok: false, error: "Количество дней просрочки должно быть больше нуля" };

  if (days <= 30) {
    return {
      ok: true,
      lines: [
        {
          label: "Пеня",
          value: formatCurrency(0),
          hint: "Первые 30 дней просрочки пеня по ЖКХ не начисляется",
        },
      ],
    };
  }

  const utilityResult = calculateUtilityPenalty(debt, days, keyRate);
  const {
    daysAtOneThreeHundredth,
    daysAtOneHundredThirtieth,
    penaltyAtOneThreeHundredth,
    penaltyAtOneHundredThirtieth,
    totalPenalty,
    effectiveKeyRate,
    rateCapped,
  } = utilityResult;

  const lines: ResultLine[] = [
    {
      label: "Ставка для расчёта ЖКХ",
      value: `${(effectiveKeyRate * 100).toFixed(2)}%`,
      hint: rateCapped
        ? `До 01.01.2027 по ПП РФ № 329 берётся min(ставка ЦБ, ${UTILITY_CAP_PERCENT}%)`
        : "Потолок 9,5% не сработал — введённая ставка ниже или равна 9,5%",
    },
    { label: "Дней без пени (1–30)", value: `${Math.min(days, 30)} дн.` },
    {
      label: "Пеня по ставке 1/300 (31–90 день)",
      value: formatCurrency(penaltyAtOneThreeHundredth),
      hint: `${daysAtOneThreeHundredth} дн. просрочки в этом периоде`,
    },
  ];

  if (daysAtOneHundredThirtieth > 0) {
    lines.push({
      label: "Пеня по ставке 1/130 (с 91-го дня)",
      value: formatCurrency(penaltyAtOneHundredThirtieth),
      hint: `${daysAtOneHundredThirtieth} дн. просрочки в этом периоде`,
    });
  }

  lines.push({ label: "Итого пеня", value: formatCurrency(totalPenalty), emphasis: true });

  return { ok: true, lines, breakdown: buildUtilityBreakdown(debt, utilityResult) };
}

export function PeniCalculatorForm() {
  const [mode, setMode] = useState<"tax" | "utility">("tax");
  const isFirstRender = useRef(true);

  // Восстанавливает режим из ссылки (?mode=utility), если она была расшарена в этом состоянии.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- чтение URL возможно только на клиенте
    if (params.get("mode") === "utility") setMode("utility");
  }, []);

  // Сохраняет текущий режим в URL, не трогая параметры полей - их пишет сам <Calculator>.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set("mode", mode);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, [mode]);

  return (
    <div>
      <div className="mb-4 flex gap-2 text-sm" role="tablist" aria-label="Вид пени">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "tax"}
          onClick={() => setMode("tax")}
          className={`rounded-lg px-3 py-2 transition-colors ${
            mode === "tax"
              ? "bg-accent text-accent-foreground"
              : "border border-border hover:border-accent"
          }`}
        >
          Пеня по налогам
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "utility"}
          onClick={() => setMode("utility")}
          className={`rounded-lg px-3 py-2 transition-colors ${
            mode === "utility"
              ? "bg-accent text-accent-foreground"
              : "border border-border hover:border-accent"
          }`}
        >
          Пеня по ЖКХ
        </button>
      </div>

      {mode === "tax" ? (
        <Calculator
          key="tax"
          historyId="tax"
          resultCardTitle="Пеня по налогам"
          fields={[debtField, daysField, rateField]}
          calculate={taxCalculate}
        />
      ) : (
        <Calculator
          key="utility"
          historyId="utility"
          resultCardTitle="Пеня по ЖКХ"
          fields={[debtField, daysField, rateField]}
          calculate={utilityCalculate}
        />
      )}
    </div>
  );
}
