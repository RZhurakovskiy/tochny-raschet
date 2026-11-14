import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";

export function renderOgImage(title: string) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "72px 82px",
        background: "#14111f",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          right: -180,
          top: -260,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(124,58,237,.55), transparent 68%)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 34, fontWeight: 700 }}>
        <svg width="68" height="68" viewBox="0 0 104 104">
          <rect x="5" y="5" width="94" height="94" rx="16" fill="none" stroke="#a78bfa" strokeWidth="10" />
          <rect x="20" y="24" width="64" height="30" rx="6" fill="#ffffff" />
          <rect x="20" y="60" width="28" height="13" rx="4" fill="#a78bfa" />
          <rect x="56" y="60" width="28" height="13" rx="4" fill="#a78bfa" />
          <rect x="20" y="76" width="28" height="13" rx="4" fill="#a78bfa" />
          <rect x="56" y="76" width="28" height="13" rx="4" fill="#a78bfa" />
        </svg>
        <span>{siteConfig.name}</span>
      </div>
      <div
        style={{ display: "flex", fontSize: 68, fontWeight: 800, marginTop: 44, lineHeight: 1.08, maxWidth: 900 }}
      >
        Посчитайте точную сумму <span style={{ color: "#a78bfa" }}>за секунды</span>
      </div>
      <div style={{ display: "flex", fontSize: 30, color: "#c7c2d7", marginTop: 30 }}>
        НДФЛ · отпускные · больничные · алименты · ипотека
      </div>
      <div style={{ display: "flex", marginTop: 56, fontSize: 24, color: "#a78bfa", fontWeight: 600 }}>
        Бесплатно · без регистрации · с понятным разбором
      </div>
    </div>,
    ogImageSize,
  );
}
