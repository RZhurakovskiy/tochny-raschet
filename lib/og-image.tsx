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
        padding: "80px",
        background: "#ffffff",
        color: "#18181b",
      }}
    >
      <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#7c3aed" }}>
        {siteConfig.name}
      </div>
      <div
        style={{ display: "flex", fontSize: 64, fontWeight: 700, marginTop: 24, lineHeight: 1.2 }}
      >
        {title}
      </div>
    </div>,
    ogImageSize,
  );
}
