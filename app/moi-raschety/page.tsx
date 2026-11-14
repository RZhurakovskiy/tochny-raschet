import type { Metadata } from "next";
import { MoiRaschetyContent } from "@/components/MoiRaschetyContent";

export const metadata: Metadata = {
  title: "Мои расчёты",
  robots: { index: false, follow: true },
};

export default function MoiRaschetyPage() {
  return <MoiRaschetyContent />;
}
