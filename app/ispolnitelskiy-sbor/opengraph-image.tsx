import { renderOgImage, ogImageSize, ogImageContentType } from "@/lib/og-image";
import { getCalculatorBySlug } from "@/lib/calculators/registry";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage(getCalculatorBySlug("ispolnitelskiy-sbor")!.title);
}
