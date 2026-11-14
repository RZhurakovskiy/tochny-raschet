import { renderOgImage, ogImageSize, ogImageContentType } from "@/lib/og-image";
import { siteConfig } from "@/lib/site-config";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage(`${siteConfig.name} - калькуляторы жизненных задач`);
}
