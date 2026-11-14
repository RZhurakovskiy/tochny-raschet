export type IcsReminderOptions = {
  title: string;
  description?: string;
  /** Дата события целиком (без времени) - ISO-строка "ГГГГ-ММ-ДД". */
  date: string;
};

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function isoToIcsDate(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

/** Дата на день позже - VEVENT на весь день по RFC 5545 требует DTEND, исключающий сам конец. */
function nextDayIsoDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Собирает содержимое .ics-файла с одним событием на весь день - для кнопки "Добавить в
 * календарь". Событие уходит во внешний календарь пользователя (Google/Outlook/Apple), поэтому не
 * зависит от localStorage/истории браузера на этом сайте.
 */
export function buildIcsContent({ title, description, date }: IcsReminderOptions): string {
  const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@tochny-raschet.ru`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ТочныйРасчёт//Calendar Reminder//RU",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${isoToIcsDate(date)}`,
    `DTEND;VALUE=DATE:${isoToIcsDate(nextDayIsoDate(date))}`,
    `SUMMARY:${escapeIcsText(title)}`,
    ...(description ? [`DESCRIPTION:${escapeIcsText(description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}
