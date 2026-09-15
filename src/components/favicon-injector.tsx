"use client";

import { useEffect } from "react";
import { useStore, initialFaviconConfig } from "@/lib/store";

export function FaviconInjector() {
  const faviconConfig = useStore(
    (s) => s.faviconConfig || initialFaviconConfig
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Update document title if siteTitle is provided
    if (faviconConfig.siteTitle) {
      document.title = faviconConfig.siteTitle;
    }

    // Update Favicon Link Element
    if (faviconConfig.faviconUrl) {
      let faviconLink = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (!faviconLink) {
        faviconLink = document.createElement("link");
        faviconLink.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(faviconLink);
      }
      faviconLink.href = faviconConfig.faviconUrl;
    }

    // Update Apple Touch Icon Link Element
    if (faviconConfig.appleTouchIconUrl) {
      let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
      if (!appleLink) {
        appleLink = document.createElement("link");
        appleLink.rel = "apple-touch-icon";
        document.getElementsByTagName("head")[0].appendChild(appleLink);
      }
      appleLink.href = faviconConfig.appleTouchIconUrl;
    }
  }, [faviconConfig]);

  return null;
}
