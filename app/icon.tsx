import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Упрощённая версия иконки калькулятора - рамка, экран и 4 крупных блока вместо 6 мелких кнопок
 * (как в Logo.tsx/apple-icon.tsx): на 32px шесть мелких кнопок сливаются в кашу, а без них иконка
 * не читается как калькулятор вообще - четыре крупных блока держат баланс.
 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
      }}
    >
      <svg width="26" height="26" viewBox="0 0 104 104">
        <rect
          x="5"
          y="5"
          width="94"
          height="94"
          rx="16"
          fill="none"
          stroke="#7c3aed"
          strokeWidth={10}
        />
        <rect x="20" y="24" width="64" height="30" rx="6" fill="#18181b" />
        <rect x="20" y="60" width="28" height="13" rx="4" fill="#7c3aed" />
        <rect x="56" y="60" width="28" height="13" rx="4" fill="#7c3aed" />
        <rect x="20" y="76" width="28" height="13" rx="4" fill="#7c3aed" />
        <rect x="56" y="76" width="28" height="13" rx="4" fill="#7c3aed" />
      </svg>
    </div>,
    size,
  );
}
