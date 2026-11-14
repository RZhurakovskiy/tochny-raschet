import type { ReactNode } from "react";

type ContentSectionProps = {
  title: string;
  /** Выделяет раздел акцентным фоном - используется для примеров расчёта */
  highlight?: boolean;
  children: ReactNode;
};

export function ContentSection({ title, highlight = false, children }: ContentSectionProps) {
  return (
    <section
      className={`rounded-2xl border p-6 sm:p-8 ${
        highlight ? "border-accent/30 bg-accent-soft" : "border-border bg-card"
      }`}
    >
      <h2
        className={`text-xl font-semibold sm:text-2xl ${
          highlight ? "text-accent-soft-foreground" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      <div className="prose prose-neutral mt-3 max-w-none prose-a:text-accent prose-a:no-underline [&_a:hover]:underline dark:prose-invert">
        {children}
      </div>
    </section>
  );
}
