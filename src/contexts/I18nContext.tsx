import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translations, type LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from "@/i18n/translations.ts";

interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = (globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null) ?? null;
    if (stored && translations[stored]) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    if (!translations[lang]) return;
    setLanguageState(lang);
    try {
      globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Intentionally ignore persistence errors (e.g., private mode or disabled storage)
    }
  }, []);

  const t = useCallback((key: string, fallback?: string) => {
    const dict = translations[language] as Record<string, unknown>;
    const parts = key.split(".");
    let current: unknown = dict;
    for (const part of parts) {
      if (typeof current === "object" && current !== null && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        current = undefined;
        break;
      }
    }
    if (typeof current === "string") return current;
    return fallback ?? key;
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}


