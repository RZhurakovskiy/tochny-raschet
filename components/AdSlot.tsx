"use client";

import { useEffect, useId } from "react";
import { siteConfig } from "@/lib/site-config";

declare global {
  interface Window {
    yaContextCb?: Array<() => void>;
    Ya?: {
      Context: {
        AdvManager: {
          render: (options: { renderTo: string; blockId: string }) => void;
        };
      };
    };
  }
}

/**
 * Блок РСЯ. Требует, чтобы <YandexAdsLoader /> уже был подключён в layout (загружает
 * window.yaContextCb и context.js). Ничего не рендерит, пока не задан
 * NEXT_PUBLIC_YANDEX_ADS_BLOCK_ID - безопасно использовать до подключения РСЯ.
 */
export function AdSlot() {
  const blockId = siteConfig.yandexAdsBlockId;
  const rawId = useId();
  const containerId = `ya-rtb-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    if (!blockId) return;
    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
      window.Ya?.Context.AdvManager.render({ renderTo: containerId, blockId });
    });
  }, [blockId, containerId]);

  if (!blockId) return null;

  return (
    <div className="my-8">
      <p className="mb-1 text-center text-xs text-muted">Реклама</p>
      <div id={containerId} />
    </div>
  );
}
