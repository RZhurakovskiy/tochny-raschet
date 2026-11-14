"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { CalculationBreakdown } from "@/components/CalculationBreakdown";
import { DateField } from "@/components/DateField";
import { reachGoal } from "@/lib/analytics";
import { formatDate } from "@/lib/format";
import { loadProfile, saveProfileValue, clearProfile, type ProfileValues } from "@/lib/profile";
import { renderResultCard } from "@/lib/resultCard";
import { siteConfig } from "@/lib/site-config";

const RECALCULATE_DEBOUNCE_MS = 250;
const HISTORY_SAVE_DEBOUNCE_MS = 1500;
const HISTORY_LIMIT = 5;

export type CalculatorFieldOption = {
  value: string;
  label: string;
};

type FieldBase = {
  id: string;
  label: string;
  hint?: string;
  /**
   * Поле встаёт на всю ширину сетки (2 колонки от sm), даже если это number/select, которые
   * по умолчанию встают по 2 в ряд. Нужно, когда соседнее по порядку поле в массиве fields -
   * не настоящая пара этому (например, поле-«шапка» перед двумя логически парными полями ниже -
   * без этого пара визуально расъезжается на разные строки сетки).
   */
  fullWidth?: boolean;
};

export type NumberField = FieldBase & {
  type: "number";
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  defaultValue?: number;
  /** По умолчанию поле обязательно. Укажите false, чтобы разрешить пустое значение. */
  required?: boolean;
};

export type SelectField = FieldBase & {
  type: "select";
  options: CalculatorFieldOption[];
  defaultValue?: string;
};

export type RadioField = FieldBase & {
  type: "radio";
  options: CalculatorFieldOption[];
  defaultValue?: string;
};

export type CheckboxField = FieldBase & {
  type: "checkbox";
  defaultValue?: boolean;
};

export type DateField = FieldBase & {
  type: "date";
  /** ISO-строки "ГГГГ-ММ-ДД" - тот же формат, что отдаёт native <input type="date"> */
  min?: string;
  max?: string;
  defaultValue?: string;
  required?: boolean;
};

export type CalculatorField = NumberField | SelectField | RadioField | CheckboxField | DateField;

export type CalculatorValues = Record<string, string | number | boolean>;

export type ResultLine = {
  label: string;
  value: string;
  hint?: string;
  /** Выделить строку как итоговую (крупнее и с подложкой) */
  emphasis?: boolean;
};

export type BreakdownStep = {
  label: string;
  /** Формула с уже подставленными числами, например "80 000 × 12" */
  formula?: string;
  result: string;
  note?: string;
  lawLabel?: string;
  lawHref?: string;
};

export type CalendarReminder = {
  title: string;
  description?: string;
  /** ISO-строка "ГГГГ-ММ-ДД" */
  date: string;
};

export type CalculationResult =
  | {
      ok: true;
      lines: ResultLine[];
      breakdown?: BreakdownStep[];
      calendarReminder?: CalendarReminder;
    }
  | { ok: false; error: string };

type CalculatorProps = {
  fields: CalculatorField[];
  calculate: (values: CalculatorValues) => CalculationResult;
  /**
   * Отличает историю/URL-состояние калькуляторов с несколькими режимами и одинаковыми id полей
   * (например, «Пеня по налогам» / «Пеня по ЖКХ»). Если не задано, используется список id полей.
   */
  historyId?: string;
  /**
   * Связывает поля этого калькулятора с общим профилем пользователя (зарплата, стаж, число детей
   * - см. lib/profile.ts), чтобы не вводить одни и те же данные заново на каждой странице.
   * `toProfile`/`fromProfile` опциональны независимо друг от друга: например, у калькулятора НДФЛ
   * поле «доход» может означать месяц или год в зависимости от переключателя периода, поэтому оно
   * только читает профиль (`fromProfile`), но не пишет в него (`toProfile` не задан).
   */
  profileSync?: ProfileFieldSync[];
  /** Короткое название калькулятора для карточки-картинки результата (например, "НДФЛ"). */
  resultCardTitle?: string;
};

export type ProfileFieldSync = {
  fieldId: string;
  profileKey: string;
  toProfile?: (value: string | number | boolean) => number | undefined;
  fromProfile?: (value: number) => string | number;
};

type HistoryEntry = {
  id: string;
  savedAt: string;
  values: CalculatorValues;
  summary: string;
};

function initialValues(fields: CalculatorField[]): CalculatorValues {
  const values: CalculatorValues = {};
  for (const field of fields) {
    if (field.type === "checkbox") {
      values[field.id] = field.defaultValue ?? false;
    } else if (field.type === "number" || field.type === "date") {
      values[field.id] = field.defaultValue ?? "";
    } else {
      values[field.id] = field.defaultValue ?? field.options[0]?.value ?? "";
    }
  }
  return values;
}

const EMPTY_FIELD_MESSAGE = "Заполните поле";

function validateFields(fields: CalculatorField[], values: CalculatorValues) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.type === "number") {
      const raw = values[field.id];
      if (raw === "" || raw === undefined) {
        if (field.required !== false) errors[field.id] = EMPTY_FIELD_MESSAGE;
        continue;
      }
      const num = Number(raw);
      if (Number.isNaN(num)) {
        errors[field.id] = "Введите число";
      } else if (field.min !== undefined && num < field.min) {
        errors[field.id] = `Не меньше ${field.min}`;
      } else if (field.max !== undefined && num > field.max) {
        errors[field.id] = `Не больше ${field.max}`;
      }
    } else if (field.type === "date") {
      const raw = values[field.id];
      if (raw === "" || raw === undefined) {
        if (field.required !== false) errors[field.id] = EMPTY_FIELD_MESSAGE;
        continue;
      }
      // ISO-строки "ГГГГ-ММ-ДД" сравниваются как обычные строки в хронологическом порядке.
      if (field.min !== undefined && (raw as string) < field.min) {
        errors[field.id] = "Дата раньше допустимой";
      } else if (field.max !== undefined && (raw as string) > field.max) {
        errors[field.id] = "Дата позже допустимой";
      }
    }
  }
  return errors;
}

function parseValueFromParam(
  field: CalculatorField,
  raw: string,
): string | number | boolean | undefined {
  if (field.type === "number") {
    const num = Number(raw);
    return raw !== "" && !Number.isNaN(num) ? num : undefined;
  }
  if (field.type === "checkbox") {
    return raw === "1" || raw === "true";
  }
  if (field.type === "date") {
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  }
  return field.options.some((option) => option.value === raw) ? raw : undefined;
}

/**
 * Событие, которое сторонние виджеты-соседи (например, IpotekaExtraPaymentSlider) могут слушать,
 * чтобы узнать, когда основная форма калькулятора обновила query-строку - history.replaceState
 * не поднимает popstate/hashchange, поэтому без явного события соседний компонент не узнал бы,
 * что в URL появились/изменились реальные значения полей.
 */
export const CALCULATOR_URL_SYNC_EVENT = "calculator-url-sync";

/** Обновляет query-строку в адресной строке под текущие значения полей, не трогая чужие параметры (например, ?mode=). */
function syncValuesToUrl(fields: CalculatorField[], values: CalculatorValues) {
  const params = new URLSearchParams(window.location.search);
  for (const field of fields) {
    const value = values[field.id];
    const isEmpty =
      value === "" || value === undefined || (field.type === "checkbox" && value === false);
    if (isEmpty) {
      params.delete(field.id);
    } else {
      params.set(field.id, String(value));
    }
  }
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(CALCULATOR_URL_SYNC_EVENT));
}

function historyStorageKey(
  pathname: string,
  historyId: string | undefined,
  fields: CalculatorField[],
) {
  const signature = historyId ?? fields.map((field) => field.id).join(",");
  return `tochny-raschet:history:${pathname}:${signature}`;
}

function loadHistory(key: string): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistHistory(key: string, entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(entries));
  } catch {
    // localStorage может быть недоступен (приватный режим и т.п.) - история просто не сохранится
  }
}

function summarizeResult(result: CalculationResult): string {
  if (!result.ok) return "";
  const line = result.lines.find((l) => l.emphasis) ?? result.lines[result.lines.length - 1];
  return line ? `${line.label}: ${line.value}` : "";
}

function resultAsText(result: CalculationResult): string {
  if (!result.ok) return result.error;
  return result.lines.map((line) => `${line.label}: ${line.value}`).join("\n");
}

/**
 * Значение поля как читаемый текст - для печатной версии. Не переиспользует сами интерактивные
 * элементы (стилизованные radio-чипы держат состояние "выбрано" через цвет фона, который браузеры
 * по умолчанию не печатают) - поэтому печатная версия строится отдельным текстовым списком, а не
 * скрытием/показом обычной формы.
 */
function formatFieldValueForPrint(
  field: CalculatorField,
  value: string | number | boolean,
): string | null {
  if (field.type === "checkbox") return value ? "да" : "нет";
  if (value === "" || value === undefined) return null;
  if (field.type === "select" || field.type === "radio") {
    return field.options.find((option) => option.value === value)?.label ?? String(value);
  }
  if (field.type === "number") return field.unit ? `${value} ${field.unit}` : String(value);
  if (field.type === "date") return formatDate(value as string);
  return String(value);
}

const historyTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "short",
  timeStyle: "short",
});

const inputClasses =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft";

export function Calculator({
  fields,
  calculate,
  historyId,
  profileSync,
  resultCardTitle,
}: CalculatorProps) {
  const [values, setValues] = useState<CalculatorValues>(() => initialValues(fields));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [resultCopied, setResultCopied] = useState(false);
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);
  const [restoredFromUrl, setRestoredFromUrl] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const formId = useId();
  const pathname = usePathname();
  const storageKey = historyStorageKey(pathname, historyId, fields);
  const lastReachedGoalKey = useRef<string | null>(null);
  const skipNextProfileWrite = useRef(false);
  const urlRestoredFieldIds = useRef<string[]>([]);

  const allErrors = validateFields(fields, values);
  // Пустое поле молча блокирует расчёт (allErrors), но не показывается как ошибка ввода -
  // в проекте нет обязательных полей, тревожная красная рамка/текст здесь неуместны.
  const visibleFieldErrors: Record<string, string> = {};
  for (const [id, message] of Object.entries(allErrors)) {
    if (touched[id] && message !== EMPTY_FIELD_MESSAGE) visibleFieldErrors[id] = message;
  }

  function updateValue(id: string, value: string | number | boolean) {
    setValues((prev) => ({ ...prev, [id]: value }));
    setTouched((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  }

  function restoreFromHistory(entry: HistoryEntry) {
    setValues(entry.values);
    setTouched((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(entry.values)) next[id] = true;
      return next;
    });
  }

  function clearHistory() {
    setHistory([]);
    persistHistory(storageKey, []);
  }

  function copyLink() {
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch(() => {});
  }

  function printResult() {
    window.print();
  }

  function copyResultText() {
    if (!result) return;
    navigator.clipboard
      ?.writeText(resultAsText(result))
      .then(() => {
        setResultCopied(true);
        setTimeout(() => setResultCopied(false), 2000);
      })
      .catch(() => {});
  }

  async function shareResultCard() {
    if (!result || !result.ok || cardBusy) return;
    setCardBusy(true);
    try {
      const canvas = document.createElement("canvas");
      renderResultCard(canvas, {
        calculatorTitle: resultCardTitle ?? siteConfig.name,
        lines: result.lines,
        siteUrl: siteConfig.url.replace(/^https?:\/\//, ""),
      });
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png"),
      );
      if (!blob) return;

      const file = new File([blob], "tochny-raschet-result.png", { type: "image/png" });
      const shareData = { files: [file], title: resultCardTitle ?? siteConfig.name };
      // Web Share API для файлов пробуем только на устройствах с touch-вводом как основным
      // (pointer: coarse) - то есть на мобильных, где это реально работает. На десктопе (мышь,
      // pointer: fine) не пробуем вообще: на Windows canShare() может вернуть true, но сам
      // системный диалог падает с ошибкой на уровне ОС - а закрывается он тем же AbortError, что
      // и обычная отмена, поэтому программно отличить сбой от отмены нельзя, откат по catch не
      // спасает (проверено вживую). Сразу скачиваем - это и надёжнее, и ровно то, что нужно для
      // расшаривания на десктопе (прикрепить файл вручную), в отличие от мобильного шаринга.
      const isTouchPrimary =
        typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
      if (isTouchPrimary && navigator.share && navigator.canShare?.(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tochny-raschet-result.png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } finally {
      setCardBusy(false);
    }
  }

  function forgetProfile() {
    clearProfile();
    setPrefilledFromProfile(false);
    if (!profileSync) return;
    skipNextProfileWrite.current = true;
    const profileFieldIds = new Set(profileSync.map((sync) => sync.fieldId));
    const defaults = initialValues(fields);
    setValues((prev) => {
      const next = { ...prev };
      for (const id of profileFieldIds) next[id] = defaults[id];
      return next;
    });
  }

  /** Сбрасывает поля, восстановленные из query-строки (например, по сохранённой/расшаренной ссылке), к дефолтам и убирает их из URL. */
  function forgetUrlValues() {
    setRestoredFromUrl(false);
    const idsToReset = urlRestoredFieldIds.current;
    urlRestoredFieldIds.current = [];
    const defaults = initialValues(fields);
    setValues((prev) => {
      const next = { ...prev };
      for (const id of idsToReset) next[id] = defaults[id];
      return next;
    });
    const params = new URLSearchParams(window.location.search);
    for (const id of idsToReset) params.delete(id);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }

  // Однократно на монтирование - подставляет значения полей из query-строки (шаринг ссылки).
  // Нельзя сделать это в начальном useState: window недоступен при SSR-рендере клиентского компонента,
  // поэтому чтение URL сознательно вынесено в эффект (внешний источник - адресная строка браузера).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const touchedIds: string[] = [];
    const urlTouchedIds: string[] = [];
    const profileTouchedIds: string[] = [];
    const profile: ProfileValues = profileSync ? loadProfile() : {};
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const field of fields) {
        const raw = params.get(field.id);
        if (raw !== null) {
          const parsed = parseValueFromParam(field, raw);
          if (parsed !== undefined) {
            next[field.id] = parsed;
            touchedIds.push(field.id);
            urlTouchedIds.push(field.id);
            changed = true;
            continue;
          }
        }
        // Нет значения из URL - пробуем подставить из общего профиля пользователя. profileSync
        // задаётся явно по каждому полю в конкретном калькуляторе, поэтому применяем его всегда,
        // а не только для полей без своего defaultValue (иначе, например, радио-кнопки с
        // заранее выбранным вариантом никогда бы не подхватывали профиль).
        const sync = profileSync?.find((s) => s.fieldId === field.id);
        if (sync?.fromProfile && profile[sync.profileKey] !== undefined) {
          next[field.id] = sync.fromProfile(profile[sync.profileKey]);
          touchedIds.push(field.id);
          profileTouchedIds.push(field.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    if (touchedIds.length > 0) {
      setTouched((prev) => {
        const next = { ...prev };
        for (const id of touchedIds) next[id] = true;
        return next;
      });
    }
    if (profileTouchedIds.length > 0) setPrefilledFromProfile(true);
    if (urlTouchedIds.length > 0) {
      urlRestoredFieldIds.current = urlTouchedIds;
      setRestoredFromUrl(true);
    }
    setHistory(loadHistory(storageKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const timer = setTimeout(() => {
      syncValuesToUrl(fields, values);
      if (profileSync && skipNextProfileWrite.current) {
        skipNextProfileWrite.current = false;
      } else if (profileSync) {
        for (const sync of profileSync) {
          if (!sync.toProfile) continue;
          const raw = values[sync.fieldId];
          if (raw === "" || raw === undefined) continue;
          const numeric = sync.toProfile(raw);
          if (numeric !== undefined && Number.isFinite(numeric)) {
            saveProfileValue(sync.profileKey, numeric);
          }
        }
      }
      if (Object.keys(allErrors).length > 0) {
        setResult(null);
        return;
      }
      const nextResult = calculate(values);
      setResult(nextResult);
      if (nextResult.ok) {
        const key = JSON.stringify(values);
        if (lastReachedGoalKey.current !== key) {
          lastReachedGoalKey.current = key;
          reachGoal("calculation_completed");
        }
      }
    }, RECALCULATE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  // Отдельный, более длинный debounce - сохраняет в историю только "устоявшийся" расчёт,
  // а не каждое промежуточное значение при наборе цифр.
  useEffect(() => {
    if (!result || !result.ok) return;
    const timer = setTimeout(() => {
      const entry: HistoryEntry = {
        id: `${Date.now()}`,
        savedAt: new Date().toISOString(),
        values: { ...values },
        summary: summarizeResult(result),
      };
      setHistory((prev) => {
        const deduped = prev.filter(
          (item) => JSON.stringify(item.values) !== JSON.stringify(entry.values),
        );
        const next = [entry, ...deduped].slice(0, HISTORY_LIMIT);
        persistHistory(storageKey, next);
        return next;
      });
    }, HISTORY_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, storageKey]);

  return (
    <div>
      {/* Печатная версия введённых данных - текстом, а не самой формой (см. formatFieldValueForPrint). */}
      <dl className="hidden print:block">
        {fields.map((field) => {
          const display = formatFieldValueForPrint(field, values[field.id]);
          if (display === null) return null;
          return (
            <div key={field.id} className="flex gap-2 py-0.5 text-sm">
              <dt className="text-muted">{field.label}:</dt>
              <dd>{display}</dd>
            </div>
          );
        })}
      </dl>

      {/* Форма и результат нарочно уже, чем статья: колонка шириной с сами поля ввода читается
          и заполняется быстрее, чем поля, растянутые на всю ширину текстового контейнера. */}
      <div className="max-w-2xl print:max-w-none">
        {prefilledFromProfile && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent-soft bg-accent-soft px-3 py-2 text-sm text-accent-soft-foreground print:hidden">
            <span>Часть полей заполнена по данным, которые вы вводили в других калькуляторах.</span>
            <button type="button" onClick={forgetProfile} className="font-medium underline shrink-0">
              Не использовать
            </button>
          </div>
        )}

        {restoredFromUrl && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent-soft bg-accent-soft px-3 py-2 text-sm text-accent-soft-foreground print:hidden">
            <span>
              Часть полей заполнена из ссылки на этот расчёт - своей прошлой или полученной от
              кого-то.
            </span>
            <button
              type="button"
              onClick={forgetUrlValues}
              className="font-medium underline shrink-0"
            >
              Очистить
            </button>
          </div>
        )}

        {/* number/select идут по 2 в ряд от sm и шире - экономит вертикальный скролл для коротких
            однотипных полей. radio/checkbox/date (длинные подсказки, варианты) - на всю ширину. */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-4 print:hidden">
        {fields.map((field) => {
          const inputId = `${formId}-${field.id}`;
          const errorId = `${inputId}-error`;
          const error = visibleFieldErrors[field.id];

          if (field.type === "checkbox") {
            return (
              <label key={field.id} className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={values[field.id] as boolean}
                  onChange={(e) => updateValue(field.id, e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                {field.label}
              </label>
            );
          }

          if (field.type === "radio") {
            return (
              <fieldset key={field.id} className="sm:col-span-2">
                <legend className="text-sm font-medium">{field.label}</legend>
                {field.hint && <p className="mt-0.5 text-xs text-muted">{field.hint}</p>}
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {field.options.map((option) => {
                    const checked = values[field.id] === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${
                          checked
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border hover:border-accent"
                        }`}
                      >
                        <input
                          type="radio"
                          name={inputId}
                          value={option.value}
                          checked={checked}
                          onChange={() => updateValue(field.id, option.value)}
                          className="sr-only"
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          }

          return (
            <div
              key={field.id}
              className={`flex flex-col${field.type === "date" || field.fullWidth ? " sm:col-span-2" : ""}`}
            >
              <label htmlFor={inputId} className="block text-sm font-medium">
                {field.label}
              </label>
              {field.hint && <p className="mt-0.5 text-xs text-muted">{field.hint}</p>}
              {/* flex-1 + justify-end: если у соседнего поля в паре (2 в ряд, см. выше) подсказка
                  длиннее и заняла больше строк, инпут всё равно остаётся на одной высоте с ним -
                  а не проваливается из-за разной высоты текста над ним. */}
              <div className="mt-1.5 flex flex-1 flex-col justify-end">
                {field.type === "number" ? (
                  <div className="relative">
                    <input
                      id={inputId}
                      type="number"
                      inputMode="decimal"
                      min={field.min}
                      max={field.max}
                      step={field.step ?? "any"}
                      placeholder={field.placeholder}
                      value={values[field.id] as number | string}
                      onChange={(e) =>
                        updateValue(field.id, e.target.value === "" ? "" : Number(e.target.value))
                      }
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? errorId : undefined}
                      className={inputClasses + (field.unit ? " pr-12" : "")}
                    />
                    {field.unit && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                        {field.unit}
                      </span>
                    )}
                  </div>
                ) : field.type === "date" ? (
                  <DateField
                    id={inputId}
                    min={field.min}
                    max={field.max}
                    value={values[field.id] as string}
                    onChange={(next) => updateValue(field.id, next)}
                    invalid={Boolean(error)}
                    describedBy={error ? errorId : undefined}
                  />
                ) : (
                  <select
                    id={inputId}
                    value={values[field.id] as string}
                    onChange={(e) => updateValue(field.id, e.target.value)}
                    className={inputClasses}
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {error && (
                <p id={errorId} className="mt-1 text-xs text-danger">
                  {error}
                </p>
              )}
            </div>
          );
        })}
        </div>

        {result && (
        <div className="mt-6" aria-live="polite">
          {result.ok ? (
            <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border shadow-sm">
              {result.lines.map((line, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${
                    line.emphasis ? "bg-accent-soft" : ""
                  }`}
                >
                  <div>
                    <dt
                      className={
                        line.emphasis
                          ? "font-semibold text-accent-soft-foreground"
                          : "text-sm text-muted"
                      }
                    >
                      {line.label}
                    </dt>
                    {line.hint && <dd className="mt-0.5 text-xs text-muted">{line.hint}</dd>}
                  </div>
                  <dd
                    className={
                      line.emphasis ? "text-lg font-bold text-accent-soft-foreground" : "text-base"
                    }
                  >
                    {line.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {result.ok && result.breakdown && <CalculationBreakdown steps={result.breakdown} />}
          {!result.ok && (
            <p
              role="alert"
              className="rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm text-danger"
            >
              {result.error}
            </p>
          )}
          {result.ok && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 print:hidden">
              <button
                type="button"
                onClick={copyLink}
                className="text-sm text-accent hover:underline"
              >
                {linkCopied ? "Ссылка скопирована ✓" : "Скопировать ссылку на этот расчёт"}
              </button>
              <button
                type="button"
                onClick={copyResultText}
                className="text-sm text-accent hover:underline"
              >
                {resultCopied ? "Результат скопирован ✓" : "Скопировать результат"}
              </button>
              <button
                type="button"
                onClick={shareResultCard}
                disabled={cardBusy}
                className="text-sm text-accent hover:underline disabled:opacity-60"
              >
                {cardBusy ? "Готовим картинку…" : "Скачать картинку с результатом"}
              </button>
              <button
                type="button"
                onClick={printResult}
                className="text-sm text-accent hover:underline"
              >
                Распечатать / сохранить PDF
              </button>
              {result.calendarReminder && <AddToCalendarButton {...result.calendarReminder} />}
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6 rounded-xl border border-border p-4 print:hidden">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">История расчётов</h3>
            <button
              type="button"
              onClick={clearHistory}
              className="text-xs text-muted hover:text-danger"
            >
              Очистить
            </button>
          </div>
          <ul className="mt-2 space-y-1">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => restoreFromHistory(entry)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent-soft"
                >
                  <span className="truncate">{entry.summary}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {historyTimeFormatter.format(new Date(entry.savedAt))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </div>
  );
}
