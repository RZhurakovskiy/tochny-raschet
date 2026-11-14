"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });
const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const POPOVER_WIDTH = 296;
const VIEWPORT_MARGIN = 8;
const POPOVER_GAP = 6;

type DateFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
};

function parseIso(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 42 ячейки (6 недель) вокруг viewMonth, неделя начинается с понедельника. */
function buildMonthGrid(viewMonth: Date): Date[] {
  const firstOfMonth = startOfMonth(viewMonth);
  const firstWeekdayMondayIndexed = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstWeekdayMondayIndexed);
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M8 2.5v4M16 2.5v4M3 9.5h18" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

/**
 * Поле выбора даты со своим компактным календарём вместо нативного `<input type="date">`:
 * открывается кликом по всему полю (а не только по мелкой иконке), сам подбирает сторону
 * (сверху/снизу) и не растягивается на весь экран независимо от браузера и ОС.
 */
export function DateField({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = "Выберите дату",
  invalid,
  describedBy,
}: DateFieldProps) {
  const selected = useMemo(() => (value ? parseIso(value) : null), [value]);
  const minDate = useMemo(() => (min ? parseIso(min) : null), [min]);
  const maxDate = useMemo(() => (max ? parseIso(max) : null), [max]);
  const today = useMemo(() => startOfDay(new Date()), []);

  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected ?? today));
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    setViewMonth(startOfMonth(selected ?? today));
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const popoverHeight = popoverRef.current?.offsetHeight ?? 336;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Открываем вверх, только если снизу тесно и сверху свободнее - иначе (тесно с обеих
      // сторон, например короткий мобильный экран) остаёмся снизу и просто прижимаем к вьюпорту.
      const openUp = spaceBelow < popoverHeight + VIEWPORT_MARGIN && spaceAbove > spaceBelow;
      const rawTop = openUp ? rect.top - popoverHeight - POPOVER_GAP : rect.bottom + POPOVER_GAP;
      const maxTop = Math.max(window.innerHeight - popoverHeight - VIEWPORT_MARGIN, VIEWPORT_MARGIN);
      const top = Math.min(Math.max(rawTop, VIEWPORT_MARGIN), maxTop);
      const maxLeft = Math.max(window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN, VIEWPORT_MARGIN);
      const left = Math.min(Math.max(rect.left, VIEWPORT_MARGIN), maxLeft);
      setCoords({ top, left });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, viewMonth]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function isDisabled(day: Date): boolean {
    if (minDate && day < minDate) return true;
    if (maxDate && day > maxDate) return true;
    return false;
  }

  function selectDay(day: Date) {
    if (isDisabled(day)) return;
    onChange(toIso(day));
    setOpen(false);
    triggerRef.current?.focus();
  }

  const grid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const monthLabel = capitalize(MONTH_YEAR_FORMATTER.format(viewMonth));

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2.5 text-left text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft ${
          invalid ? "border-danger" : "border-border"
        }`}
      >
        <span className={selected ? "" : "text-muted"}>
          {selected ? capitalize(DAY_LABEL_FORMATTER.format(selected)) : placeholder}
        </span>
        <CalendarIcon />
      </button>

      {open
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label="Выбор даты"
              style={{
                position: "fixed",
                top: coords?.top ?? 0,
                left: coords?.left ?? 0,
                width: POPOVER_WIDTH,
                visibility: coords ? "visible" : "hidden",
              }}
              className="z-50 rounded-xl border border-border bg-card p-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                  aria-label="Предыдущий месяц"
                  className="rounded-md p-1.5 text-muted hover:bg-accent-soft hover:text-accent-soft-foreground"
                >
                  <ChevronIcon direction="left" />
                </button>
                <span className="text-sm font-medium">{monthLabel}</span>
                <button
                  type="button"
                  onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                  aria-label="Следующий месяц"
                  className="rounded-md p-1.5 text-muted hover:bg-accent-soft hover:text-accent-soft-foreground"
                >
                  <ChevronIcon direction="right" />
                </button>
              </div>

              <div className="mt-2 grid grid-cols-7 text-center text-xs text-muted">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="py-1">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {grid.map((day) => {
                  const inMonth = day.getMonth() === viewMonth.getMonth();
                  const isSelected = selected ? isSameDay(day, selected) : false;
                  const isToday = isSameDay(day, today);
                  const disabled = isDisabled(day);
                  return (
                    <button
                      key={day.getTime()}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDay(day)}
                      className={[
                        "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                        disabled
                          ? "cursor-not-allowed text-muted/40"
                          : inMonth
                            ? "text-foreground hover:bg-accent-soft"
                            : "text-muted hover:bg-accent-soft",
                        isSelected ? "bg-accent text-accent-foreground hover:bg-accent" : "",
                        isToday && !isSelected ? "font-semibold text-accent" : "",
                      ].join(" ")}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm">
                <button
                  type="button"
                  onClick={() => selectDay(today)}
                  disabled={isDisabled(today)}
                  className="text-accent hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                >
                  Сегодня
                </button>
                {selected && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                    }}
                    className="text-muted hover:text-danger"
                  >
                    Очистить
                  </button>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
