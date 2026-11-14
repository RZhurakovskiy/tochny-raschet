import type { BreakdownStep } from "@/components/Calculator";
import { LawLink } from "@/components/LawLink";

/**
 * Свёрнутый по умолчанию пошаговый разбор расчёта - продолжение того же "что если" исследования
 * (см. GradientMeterBar/*WhatIfSlider), только теперь про "почему именно такая сумма" у реального
 * результата калькулятора, а не у гипотетического значения на ползунке.
 */
export function CalculationBreakdown({ steps }: { steps: BreakdownStep[] }) {
  if (steps.length === 0) return null;

  return (
    <details className="group mt-2 print:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-accent marker:content-none">
        <span className="group-hover:underline">Показать расчёт по шагам</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <ol className="mt-3 rounded-lg border border-border bg-background p-3">
        {steps.map((step, index) => (
          <li key={index} className="relative flex items-start gap-3 pb-4 text-sm last:pb-0">
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute bottom-0 left-[9px] top-0.5 w-0.5 rounded-full bg-foreground"
              />
            )}
            <span className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-foreground">
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span>{step.label}</span>
                {step.lawHref && step.lawLabel && (
                  <span className="text-xs text-accent hover:underline">
                    <LawLink href={step.lawHref}>{step.lawLabel}</LawLink>
                  </span>
                )}
              </div>
              {step.formula && (
                <p className="mt-0.5 font-mono text-xs text-muted">
                  {step.formula} = <span className="text-foreground">{step.result}</span>
                </p>
              )}
              {!step.formula && <p className="mt-0.5 text-foreground">{step.result}</p>}
              {step.note && <p className="mt-0.5 text-xs text-muted">{step.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}
