import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/site-config";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { YandexMetrika } from "@/components/YandexMetrika";
import { YandexAdsLoader } from "@/components/YandexAdsLoader";
import { RouteProgressBar } from "@/components/RouteProgressBar";
import { BugReportButton } from "@/components/BugReportButton";
import { VkMiniAppProvider } from "@/components/VkMiniAppProvider";
import { AppTour } from "@/components/AppTour";

/**
 * Применяет сохранённую тему до первой отрисовки, чтобы избежать мигания. По умолчанию —
 * тёмная тема для всех, независимо от системных настроек; светлая включается только если
 * пользователь сам переключил её раньше (ThemeToggle сохраняет выбор в localStorage).
 */
const THEME_INIT_SCRIPT = `
  try {
    if (localStorage.getItem('theme') !== 'light') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - калькуляторы жизненных задач`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  verification: {
    yandex: siteConfig.yandexVerification,
    google: siteConfig.googleVerification,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#18181b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <VkMiniAppProvider />
        <AppTour />
        <RouteProgressBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <YandexMetrika />
        <YandexAdsLoader />
        <BugReportButton />
      </body>
    </html>
  );
}
