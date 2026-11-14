import type { ReactNode } from "react";

type LawLinkProps = {
  href: string;
  children: ReactNode;
};

/** Ссылка на конкретную статью закона - для инлайн-цитат внутри текста калькулятора. */
export function LawLink({ href, children }: LawLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  );
}
