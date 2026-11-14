"use client";

import { useEffect } from "react";
import bridge from "@vkontakte/vk-bridge";

/** Initializes the VK host when this build is opened inside a VK Mini App. */
export function VkMiniAppProvider() {
  useEffect(() => {
    let disposed = false;

    void bridge
      .send("VKWebAppInit")
      .then(() => {
        if (!disposed) document.documentElement.dataset.vkMiniApp = "true";
      })
      .catch(() => {
        // The site remains usable in a regular browser and during local development.
      });

    return () => {
      disposed = true;
      delete document.documentElement.dataset.vkMiniApp;
    };
  }, []);

  return null;
}
