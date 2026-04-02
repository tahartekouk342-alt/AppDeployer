import { createContext, useContext, ReactNode } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import type { Language } from "@/lib/i18n";
import type { Theme } from "@/hooks/useAppSettings";

interface SettingsContextValue {
  theme: Theme;
  language: Language;
  updateSettings: (updates: { theme?: Theme; language?: Language }) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useAppSettings();
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
