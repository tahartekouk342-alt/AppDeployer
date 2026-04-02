import { useState, useEffect } from "react";
import type { Language } from "@/lib/i18n";

export type Theme = "dark" | "light";

interface AppSettings {
  theme: Theme;
  language: Language;
}

const STORAGE_KEY = "appdeployer_settings";

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { theme: "dark", language: "en" };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
}

function applyLanguage(lang: Language) {
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const s = loadSettings();
    return s;
  });

  // Apply on mount and whenever settings change
  useEffect(() => {
    applyTheme(settings.theme);
    applyLanguage(settings.language);
  }, [settings.theme, settings.language]);

  // Apply immediately on first render
  useEffect(() => {
    const s = loadSettings();
    applyTheme(s.theme);
    applyLanguage(s.language);
  }, []);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applyTheme(next.theme);
      applyLanguage(next.language);
      return next;
    });
  };

  return {
    theme: settings.theme,
    language: settings.language,
    updateSettings,
  };
}
