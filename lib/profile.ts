const PROFILE_STORAGE_KEY = "tochny-raschet:profile";

/**
 * Единый профиль пользователя - общие для всех калькуляторов значения (зарплата, стаж, число
 * детей), которые сохраняются в localStorage и подставляются в другие калькуляторы сайта. Без
 * бэкенда и авторизации: профиль живёт только в браузере конкретного посетителя.
 */
export type ProfileValues = Record<string, number>;

export function loadProfile(): ProfileValues {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveProfileValue(key: string, value: number): void {
  try {
    const current = loadProfile();
    current[key] = value;
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // localStorage может быть недоступен - профиль просто не сохранится
  }
}

export function clearProfile(): void {
  try {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
