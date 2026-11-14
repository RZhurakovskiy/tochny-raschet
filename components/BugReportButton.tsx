"use client";

import { useEffect, useRef, useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    textareaRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    // Небольшая задержка, чтобы форма не "прыгала" во время закрывающей анимации - сброс уже
    // после того, как модалка скрыта.
    setTimeout(() => {
      setState("idle");
      setErrorMessage("");
      setDescription("");
      setContactEmail("");
    }, 200);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "submitting") return;

    setState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          pageUrl: window.location.href,
          contactEmail: contactEmail || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setState("error");
        setErrorMessage(data.error ?? "Не удалось отправить - попробуйте позже");
        return;
      }
      setState("success");
    } catch {
      setState("error");
      setErrorMessage("Не удалось отправить - проверьте соединение и попробуйте ещё раз");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Сообщить о проблеме на сайте"
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 hover:bg-accent-hover sm:bottom-5 sm:right-5 sm:h-12 sm:w-12 print:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
          <path d="M12 8v4M12 15h.01" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bug-report-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            {state === "success" ? (
              <div className="text-center">
                <h2 id="bug-report-title" className="text-lg font-semibold">
                  Спасибо!
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Сообщение отправлено - разберёмся как можно скорее.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground hover:bg-accent-hover"
                >
                  Закрыть
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex items-start justify-between gap-4">
                  <h2 id="bug-report-title" className="text-lg font-semibold">
                    Сообщить о проблеме
                  </h2>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Закрыть"
                    className="shrink-0 rounded-md p-1 text-muted hover:bg-accent-soft hover:text-accent-soft-foreground"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <label htmlFor="bug-report-description" className="mt-4 block text-sm font-medium">
                  Что пошло не так?
                </label>
                <textarea
                  ref={textareaRef}
                  id="bug-report-description"
                  required
                  minLength={10}
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Опишите проблему - что делали и что увидели вместо ожидаемого"
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                />

                <label htmlFor="bug-report-email" className="mt-4 block text-sm font-medium">
                  Ваша почта (необязательно)
                </label>
                <input
                  id="bug-report-email"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="Если нужен ответ"
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                />

                {state === "error" && (
                  <p role="alert" className="mt-3 text-sm text-danger">
                    {errorMessage}
                  </p>
                )}

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={state === "submitting"}
                    className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
                  >
                    {state === "submitting" ? "Отправляем…" : "Отправить"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
