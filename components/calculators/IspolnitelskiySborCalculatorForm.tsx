"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calculator,
  type CalculationResult,
  type CalculatorValues,
  type ResultLine,
} from "@/components/Calculator";
import {
  calculateMoneyEnforcementFee,
  calculateNonMoneyEnforcementFee,
  type DebtorType,
} from "@/lib/calculators/ispolnitelskiy-sbor";
import { IspolnitelskiySborWhatIfSlider } from "@/components/calculators/IspolnitelskiySborWhatIfSlider";
import { formatCurrency } from "@/lib/format";

const debtorTypeField = {
  id: "debtorType",
  type: "radio" as const,
  label: "Тип должника",
  options: [
    { value: "individual", label: "Физлицо или ИП" },
    { value: "legalEntity", label: "Юридическое лицо" },
  ],
  defaultValue: "individual",
};

const debtField = {
  id: "debt",
  type: "number" as const,
  label: "Сумма долга по исполнительному документу",
  unit: "₽",
  min: 0,
  placeholder: "Например, 80000",
};

function moneyCalculate(values: CalculatorValues): CalculationResult {
  const debt = Number(values.debt);
  const debtorType = values.debtorType as DebtorType;

  if (debt <= 0) return { ok: false, error: "Сумма долга должна быть больше нуля" };

  const { rawFee, minFee, fee, flooredByMin, feeAfterMaxCourtReduction } =
    calculateMoneyEnforcementFee(debt, debtorType);

  const lines: ResultLine[] = [
    {
      label: "Сбор по ставке 12%",
      value: formatCurrency(rawFee),
      hint: "12% от суммы долга (ст. 112 229-ФЗ, ставка действует с 09.01.2026)",
    },
  ];

  if (flooredByMin) {
    lines.push({
      label: "Применён минимум",
      value: formatCurrency(minFee),
      hint: `12% от долга (${formatCurrency(rawFee)}) меньше минимума для ${
        debtorType === "individual" ? "физлиц и ИП" : "юрлиц"
      } - пристав взыщет минимум`,
    });
  }

  lines.push({
    label: "Исполнительский сбор к взысканию",
    value: formatCurrency(fee),
    emphasis: true,
  });
  lines.push({
    label: "Минимум при максимальном снижении судом",
    value: formatCurrency(feeAfterMaxCourtReduction),
    hint: "По ч. 7 ст. 112 229-ФЗ суд вправе снизить сбор не более чем на 1/4 с учётом обстоятельств должника либо освободить от него полностью - сбор не назначается автоматически в этом размере, только через суд",
  });

  return { ok: true, lines };
}

function nonMoneyCalculate(values: CalculatorValues): CalculationResult {
  const debtorType = values.debtorType as DebtorType;
  const { fee, feeAfterMaxCourtReduction } = calculateNonMoneyEnforcementFee(debtorType);

  return {
    ok: true,
    lines: [
      {
        label: "Исполнительский сбор (фиксированный)",
        value: formatCurrency(fee),
        hint: "За неисполнение неимущественного требования в срок для добровольного исполнения (ч. 3 ст. 112 229-ФЗ) - не зависит от суммы долга",
        emphasis: true,
      },
      {
        label: "Минимум при максимальном снижении судом",
        value: formatCurrency(feeAfterMaxCourtReduction),
        hint: "По ч. 7 ст. 112 229-ФЗ суд вправе снизить сбор не более чем на 1/4 или освободить от него полностью",
      },
    ],
  };
}

export function IspolnitelskiySborCalculatorForm() {
  const [mode, setMode] = useState<"money" | "nonMoney">("money");
  const isFirstRender = useRef(true);

  // Восстанавливает режим из ссылки (?mode=nonMoney), если она была расшарена в этом состоянии.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- чтение URL возможно только на клиенте
    if (params.get("mode") === "nonMoney") setMode("nonMoney");
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
      <div className="mb-4 flex gap-2 text-sm" role="tablist" aria-label="Вид требования">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "money"}
          onClick={() => setMode("money")}
          className={`rounded-lg px-3 py-2 transition-colors ${
            mode === "money"
              ? "bg-accent text-accent-foreground"
              : "border border-border hover:border-accent"
          }`}
        >
          Денежное взыскание
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "nonMoney"}
          onClick={() => setMode("nonMoney")}
          className={`rounded-lg px-3 py-2 transition-colors ${
            mode === "nonMoney"
              ? "bg-accent text-accent-foreground"
              : "border border-border hover:border-accent"
          }`}
        >
          Неимущественное требование
        </button>
      </div>

      {mode === "money" ? (
        <>
          <Calculator
            key="money"
            historyId="money"
            resultCardTitle="Исполнительский сбор (денежное взыскание)"
            fields={[debtField, debtorTypeField]}
            calculate={moneyCalculate}
          />
          <IspolnitelskiySborWhatIfSlider />
        </>
      ) : (
        <Calculator
          key="nonMoney"
          historyId="nonMoney"
          resultCardTitle="Исполнительский сбор (неимущественное требование)"
          fields={[debtorTypeField]}
          calculate={nonMoneyCalculate}
        />
      )}
    </div>
  );
}
