import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Полная версия иконки калькулятора - такая же, как в components/Logo.tsx, только без анимации. */
export default function AppleIcon() {
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
      <svg width="152" height="152" viewBox="0 0 104 104">
        <rect
          x="3.5"
          y="3.5"
          width="97"
          height="97"
          rx="14"
          fill="none"
          stroke="#7c3aed"
          strokeWidth={7}
        />
        <rect x="14" y="14" width="76" height="28" rx="5" fill="#18181b" />
        <rect x="20" y="23" width="10" height="10" rx="2" fill="#ffffff" />
        <rect x="36" y="23" width="14" height="10" rx="2" fill="#ffffff" />
        <rect x="56" y="23" width="10" height="10" rx="2" fill="#ffffff" />
        <rect x="72" y="23" width="12" height="10" rx="2" fill="#ffffff" />
        <rect x="14" y="50" width="20" height="16" rx="4" fill="#7c3aed" />
        <rect x="42" y="50" width="20" height="16" rx="4" fill="#7c3aed" />
        <rect x="70" y="50" width="20" height="16" rx="4" fill="#7c3aed" />
        <rect x="14" y="72" width="20" height="16" rx="4" fill="#7c3aed" />
        <rect x="42" y="72" width="20" height="16" rx="4" fill="#7c3aed" />
        <rect x="70" y="72" width="20" height="16" rx="4" fill="#7c3aed" />
      </svg>
    </div>,
    size,
  );
}
