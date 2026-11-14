type LogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

/** Общие классы для кнопки: поворот вокруг своего собственного центра, а не центра иконки. */
const BUTTON_TRANSFORM = "[transform-box:fill-box] origin-center";

/** Углы наведения для кнопок 3×2 - поочерёдно, слева направо, сверху вниз. */
const BUTTON_WIGGLE = [
  "group-hover:animate-logo-wiggle-1",
  "group-hover:animate-logo-wiggle-2 group-hover:[animation-delay:60ms]",
  "group-hover:animate-logo-wiggle-3 group-hover:[animation-delay:120ms]",
  "group-hover:animate-logo-wiggle-4 group-hover:[animation-delay:180ms]",
  "group-hover:animate-logo-wiggle-1 group-hover:[animation-delay:240ms]",
  "group-hover:animate-logo-wiggle-2 group-hover:[animation-delay:300ms]",
] as const;

/** Позиции кнопок - 3 колонки × 2 ряда. */
const BUTTONS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 14, y: 50 },
  { x: 42, y: 50 },
  { x: 70, y: 50 },
  { x: 14, y: 72 },
  { x: 42, y: 72 },
  { x: 70, y: 72 },
];

/** Классы мигания сегментов на табло - вразнобой, а не синхронно. */
const SCREEN_TICK = [
  "group-hover:animate-logo-screen-tick",
  "group-hover:animate-logo-screen-tick group-hover:[animation-delay:90ms]",
  "group-hover:animate-logo-screen-tick group-hover:[animation-delay:180ms]",
  "group-hover:animate-logo-screen-tick group-hover:[animation-delay:270ms]",
] as const;

/** Позиции сегментов на табло - 4 "цифры" разной ширины, как в реальном калькуляторе. */
const SCREEN_SEGMENTS: ReadonlyArray<{ x: number; width: number }> = [
  { x: 20, width: 10 },
  { x: 36, width: 14 },
  { x: 56, width: 10 },
  { x: 72, width: 12 },
];

/**
 * Логотип сайта: иконка калькулятора (экран + сетка кнопок) + словесный знак. Двухцветный, а не
 * монохромный - рамка, кнопки и слово «Точный» в фирменном фиолетовом (currentColor, наследуется
 * от обёртки и переключается в тёмной теме вместе с акцентом), а экран, сегменты на нём и слово
 * «Расчёт» - в цвете `--foreground`/`--background` (тёмный/светлый на светлой теме, наоборот на
 * тёмной - как настоящий дисплей). При наведении (класс `group` на обёртке) кнопки поочерёдно
 * крутятся, а сегменты на табло мигают вразнобой, как будто идёт пересчёт - анимации заданы в
 * globals.css (`logo-wiggle-1..4`, `logo-screen-tick`).
 */
export function Logo({ className, iconClassName, textClassName }: LogoProps) {
  return (
    <span className={`group inline-flex items-center gap-2 text-accent ${className ?? ""}`}>
      <svg viewBox="0 0 104 104" aria-hidden="true" className={iconClassName ?? "h-8 w-8"}>
        <rect
          x="3.5"
          y="3.5"
          width="97"
          height="97"
          rx="14"
          fill="none"
          stroke="currentColor"
          strokeWidth={7}
        />
        <rect x="14" y="14" width="76" height="28" rx="5" className="fill-foreground" />
        {SCREEN_SEGMENTS.map((segment, index) => (
          <rect
            key={segment.x}
            x={segment.x}
            y="23"
            width={segment.width}
            height="10"
            rx="2"
            className={`fill-background ${SCREEN_TICK[index]}`}
          />
        ))}
        {BUTTONS.map((button, index) => (
          <rect
            key={`${button.x}-${button.y}`}
            x={button.x}
            y={button.y}
            width="20"
            height="16"
            rx="4"
            fill="currentColor"
            className={`${BUTTON_TRANSFORM} ${BUTTON_WIGGLE[index]}`}
          />
        ))}
      </svg>
      <span className={textClassName ?? "text-lg font-semibold"}>
        <span className="text-accent">Точный</span>
        <span className="text-foreground">Расчёт</span>
      </span>
    </span>
  );
}
