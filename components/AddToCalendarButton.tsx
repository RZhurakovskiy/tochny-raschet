"use client";

import { buildIcsContent, type IcsReminderOptions } from "@/lib/ics";

/**
 * Кнопка "Добавить в календарь" - генерирует .ics-файл на лету и сразу скачивает его. Открытие
 * файла добавляет событие в реальный календарь пользователя (Google/Outlook/Apple), поэтому оно
 * не зависит от localStorage или истории браузера этого сайта.
 */
export function AddToCalendarButton({ title, description, date }: IcsReminderOptions) {
  function download() {
    const content = buildIcsContent({ title, description, date });
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "napominanie.ics";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  return (
    <button type="button" onClick={download} className="text-sm text-accent hover:underline">
      Добавить напоминание в календарь
    </button>
  );
}
