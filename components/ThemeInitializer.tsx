"use client";

import { useEffect } from "react";

const STORAGE_KEY = "emd-theme";

export function ThemeInitializer() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        document.documentElement.setAttribute("data-theme", stored);
      }
    } catch {}
  }, []);

  return null;
}
