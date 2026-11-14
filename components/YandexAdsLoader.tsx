import Script from "next/script";
import { siteConfig } from "@/lib/site-config";

/**
 * Код-загрузчик РСЯ - размещается один раз на странице (в layout), а не в каждом AdSlot,
 * по требованию Яндекса: https://yandex.ru/adv/edu/materials/ustanovit-kod-vyzova-reklamy
 */
export function YandexAdsLoader() {
  if (!siteConfig.yandexAdsBlockId) return null;

  return (
    <>
      <Script id="yandex-ads-init" strategy="afterInteractive">
        {`window.yaContextCb = window.yaContextCb || [];`}
      </Script>
      <Script
        id="yandex-ads-context"
        src="https://yandex.ru/ads/system/context.js"
        strategy="afterInteractive"
      />
    </>
  );
}
