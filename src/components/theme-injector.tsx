"use client";

import { useEffect } from "react";
import { useStore, initialThemeConfig } from "@/lib/store";

export function ThemeInjector() {
  const themeConfig = useStore(
    (s) => s.themeConfig || initialThemeConfig
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Use valid CSS color strings for Tailwind CSS v4 compatibility
    const primary = themeConfig.buttonColor || themeConfig.primaryColor || "#0f172a";
    const primaryFg = themeConfig.buttonTextColor || themeConfig.primaryForeground || "#ffffff";
    const secondary = themeConfig.secondaryColor || "#f1f5f9";
    const secondaryFg = themeConfig.secondaryForeground || "#0f172a";
    const accent = themeConfig.accentColor || "#f59e0b";

    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-foreground", primaryFg);
    root.style.setProperty("--secondary", secondary);
    root.style.setProperty("--secondary-foreground", secondaryFg);
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--custom-primary", primary);

    if (themeConfig.buttonRadiusPx !== undefined) {
      root.style.setProperty("--radius", `${themeConfig.buttonRadiusPx / 16}rem`);
    }
    if (themeConfig.buttonColor) {
      root.style.setProperty("--button-bg", themeConfig.buttonColor);
    }
    if (themeConfig.buttonTextColor) {
      root.style.setProperty("--button-fg", themeConfig.buttonTextColor);
    }
    if (themeConfig.buttonHoverColor) {
      root.style.setProperty("--button-hover", themeConfig.buttonHoverColor);
    }
  }, [themeConfig]);

  return null;
}
