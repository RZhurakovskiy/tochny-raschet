"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCalculatorBySlug, type Calculator } from "@/lib/calculators/registry";
import { loadProfile, clearProfile, type ProfileValues } from "@/lib/profile";
import { formatCurrency } from "@/lib/format";

const HISTORY_KEY_PREFIX = "tochny-raschet:history:";

type HistoryEntry = {
  id: string;
  savedAt: string;
  values: Record<string, string | number | boolean>;
  summary: string;
};

type HistoryEntryWithHref = HistoryEntry & { href: string };

type CalculatorGroup = {
  calculator: Calculator;
  entries: HistoryEntryWithHref[];
};

const timeFormatter = new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" });

function parseHistoryKey(key: string): { pathname: string; signature: string } | null {
  if (!key.startsWith(HISTORY_KEY_PREFIX)) return null;
  const rest = key.slice(HISTORY_KEY_PREFIX.length);
  const colonIndex = rest.indexOf(":");
  if (colonIndex === -1) return null;
  return { pathname: rest.slice(0, colonIndex), signature: rest.slice(colonIndex + 1) };
}

/**
 * Восстанавливает ссылку на калькулятор с уже заполненными полями. Для калькуляторов с режимами
 * (пеня/исполнительский сбор) добавляет ?mode= - отличаем по эвристике: явный historyId (режим)
 * всегда одно слово без запятой, а сигнатура по умолчанию - список id полей через запятую.
 */
function buildRecalculateHref(
  pathname: string,
  signature: string,
  values: HistoryEntry["values"],
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === "" || value === undefined) continue;
    params.set(key, String(value));
  }
  if (!signature.includes(",")) params.set("mode", signature);
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}

function formatProfileValue(key: string, value: number): string {
  if (key === "monthlyIncome") return formatCurrency(value);
  if (key === "insuranceYears") return `${value} лет`;
  if (key === "childrenCount") return `${value}`;
  return String(value);
}

const PROFILE_LABELS: Record<string, string> = {
  monthlyIncome: "Зарплата в месяц",
  insuranceYears: "Страховой стаж",
  childrenCount: "Количество детей",
};

export function MoiRaschetyContent() {
  const [groups, setGroups] = useState<CalculatorGroup[]>([]);
  const [profile, setProfile] = useState<ProfileValues>({});
  const [loaded, setLoaded] = useState(false);

  // Однократно на монтирование - читает историю и профиль из localStorage. Нельзя сделать это в
  // начальном useState: localStorage недоступен при SSR-рендере клиентского компонента, поэтому
  // чтение сознательно вынесено в эффект (внешний источник - localStorage браузера).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const byCalculator = new Map<string, CalculatorGroup>();

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const parsed = parseHistoryKey(key);
      if (!parsed) continue;
      const slug = parsed.pathname.replace(/^\//, "");
      const calculator = getCalculatorBySlug(slug);
      if (!calculator) continue;

      let entries: HistoryEntry[] = [];
      try {
        const raw = window.localStorage.getItem(key);
        const parsedEntries = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsedEntries)) entries = parsedEntries;
      } catch {
        continue;
      }
      if (entries.length === 0) continue;

      const withHref: HistoryEntryWithHref[] = entries.map((entry) => ({
        ...entry,
        href: buildRecalculateHref(parsed.pathname, parsed.signature, entry.values),
      }));

      const existing = byCalculator.get(slug);
      if (existing) {
        existing.entries.push(...withHref);
      } else {
        byCalculator.set(slug, { calculator, entries: withHref });
      }
    }

    for (const group of byCalculator.values()) {
      group.entries.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    }

    setGroups(
      [...byCalculator.values()].sort((a, b) => a.calculator.priority - b.calculator.priority),
    );
    setProfile(loadProfile());
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function clearEverything() {
    clearProfile();
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(HISTORY_KEY_PREFIX)) window.localStorage.removeItem(key);
    }
    setGroups([]);
    setProfile({});
  }

  if (!loaded) return null;

  const hasProfile = Object.keys(profile).length > 0;
  const hasHistory = groups.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Мои расчёты</h1>
      <p className="mt-2 text-muted">
        Всё, что вы считали на этом сайте, хранится только в этом браузере - без аккаунта и без
        отправки на сервер. На другом устройстве или после очистки данных браузера этот список будет
        пустым.
      </p>

      {!hasProfile && !hasHistory ? (
        <p className="mt-8 rounded-xl border border-border bg-card p-6 text-muted">
          Здесь появятся ваши расчёты после первого использования любого калькулятора на сайте.
        </p>
      ) : (
        <>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={clearEverything}
              className="text-sm text-muted hover:text-danger"
            >
              Очистить все сохранённые данные
            </button>
          </div>

          {hasProfile && (
            <section className="mt-4 rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">Сохранённые данные</h2>
              <dl className="mt-2 space-y-1 text-sm">
                {Object.entries(profile).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <dt className="text-muted">{PROFILE_LABELS[key] ?? key}:</dt>
                    <dd>{formatProfileValue(key, value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {groups.map(({ calculator, entries }) => (
            <section
              key={calculator.slug}
              className="mt-6 rounded-xl border border-border bg-card p-5"
            >
              <h2 className="text-lg font-semibold">
                <Link href={`/${calculator.slug}`} className="hover:text-accent">
                  {calculator.title}
                </Link>
              </h2>
              <ul className="mt-2 divide-y divide-border">
                {entries.slice(0, 10).map((entry) => (
                  <li key={entry.id} className="py-2">
                    <Link
                      href={entry.href}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm hover:text-accent"
                    >
                      <span>{entry.summary}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {timeFormatter.format(new Date(entry.savedAt))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
