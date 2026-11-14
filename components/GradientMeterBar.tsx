"use client";

import { useEffect, useRef, useState } from "react";

const IDLE_DELAY_MS = 500;

type GradientMeterBarProps = {
  label: string;
  /** Уже отформатированное значение для подписи справа (например, "47 750 ₽"). */
  formattedValue: string;
  value: number;
  max: number;
};

/**
 * Толстая полоса-индикатор с бегущей волной градиента в заливке - специально заметно толще и
 * без круглого бегунка, чтобы не читаться как ещё один слайдер рядом с настоящим. Волна запускается
 * сама при изменении value (например, пока рядом двигают связанный range-инпут) и гаснет через
 * IDLE_DELAY_MS после того, как значение перестало меняться.
 */
export function GradientMeterBar({ label, formattedValue, value, max }: GradientMeterBarProps) {
  const [active, setActive] = useState(false);
  const idleTimeoutRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setActive(true);
    if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = window.setTimeout(() => setActive(false), IDLE_DELAY_MS);
    return () => {
      if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
    };
  }, [value]);

  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-lg font-bold tabular-nums text-accent-soft-foreground">
          {formattedValue}
        </span>
      </div>
      <div
        role="img"
        aria-label={`${label}: ${formattedValue}`}
        className="mt-1.5 h-4 overflow-hidden rounded-full bg-accent-soft"
      >
        <div
          className="animate-meter-wave h-full rounded-full transition-[width] duration-150 ease-out"
          style={{
            width: `${percent}%`,
            backgroundImage:
              "linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent) 42%, var(--color-accent-hover) 50%, var(--color-accent) 58%, var(--color-accent) 100%)",
            backgroundSize: "200% 100%",
            animationPlayState: active ? "running" : "paused",
          }}
        />
      </div>
    </div>
  );
}
