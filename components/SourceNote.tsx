import { formatDate } from "@/lib/format";

export type SourceNoteProps = {
  /** ISO-дата, например "2026-08-24" */
  updatedAt: string;
  sourceLabel: string;
  sourceUrl: string;
};

export function SourceNote({ updatedAt, sourceLabel, sourceUrl }: SourceNoteProps) {
  return (
    <p className="mt-6 text-sm text-muted">
      Данные обновлены: {formatDate(updatedAt)}. Первоисточник:{" "}
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-accent underline hover:no-underline"
      >
        {sourceLabel}
      </a>
      .
    </p>
  );
}
