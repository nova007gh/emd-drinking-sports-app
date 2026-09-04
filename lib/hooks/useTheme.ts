"use client";

import { useState, useEffect, useCallback } from "react";

export type ThemeName = "black" | "white" | "red-white" | "black-red";

export const themes: Array<{ name: ThemeName; label: string; colors: string[] }> = [
  { name: "black", label: "Black & Gold", colors: ["#050505", "#f9c317"] },
  { name: "white", label: "White & Gold", colors: ["#ffffff", "#d4a017"] },
  { name: "red-white", label: "Red & White", colors: ["#ffffff", "#e74c3c"] },
  { name: "black-red", label: "Black & Red", colors: ["#0a0505", "#ff4d4d"] }
];

const STORAGE_KEY = "emd-theme";

function getStoredTheme(): ThemeName | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    if (stored && themes.some(t => t.name === stored)) return stored;
  } catch {}
  return null;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(getStoredTheme() ?? "black");

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) {
      setThemeState(stored);
      applyTheme(stored);
    } else {
      applyTheme("black");
    }
  }, []);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeState(name);
    applyTheme(name);
    try { localStorage.setItem(STORAGE_KEY, name); } catch {}
  }, []);

  return { theme, setTheme };
}

function applyTheme(name: ThemeName) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", name);
  }
}
