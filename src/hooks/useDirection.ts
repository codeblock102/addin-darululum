/**
 * @file src/hooks/useDirection.ts
 * @summary Hook that resolves the current writing direction ("ltr" | "rtl").
 *
 * The source of truth is intended to be the authenticated user's
 * `notification_preferences.locale` value (en | ar | ur). To keep this hook
 * cheap (it's mounted at the app root and runs on every page, including
 * `/auth` where notification prefs aren't needed) we read the locale from a
 * lightweight localStorage cache instead of issuing a React Query fetch.
 * The cache is populated/refreshed by NotificationsSettings whenever the user
 * loads or saves their preferences.
 *
 * Anything in the RTL_LOCALES set returns "rtl"; everything else returns "ltr".
 * Designed to be a single chokepoint so we can later swap the locale source
 * (e.g. a proper i18n library) without touching every consumer.
 */
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/contexts/I18nContext.tsx";

export type Direction = "ltr" | "rtl";

// Languages that are written right-to-left.
const RTL_LOCALES = new Set<string>(["ar", "ur", "fa", "he"]);

// Shared localStorage key so NotificationsSettings can keep this in sync
// without re-fetching notification preferences from the network.
export const LOCALE_STORAGE_KEY = "user-locale";

function readStoredLocale(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Returns the current writing direction.
 *
 * Resolution order:
 *   1. Cached `notification_preferences.locale` from localStorage (written by
 *      NotificationsSettings on load/save).
 *   2. The active I18n language (en/fr today).
 *   3. "ltr" as the safe default.
 */
export function useDirection(): Direction {
  // I18nContext is always mounted at the app root, safe to call.
  const { language } = useI18n();

  const [storedLocale, setStoredLocale] = useState<string | null>(() =>
    readStoredLocale()
  );

  // Pick up changes made in other tabs/windows, and any in-tab updates that
  // dispatch a "storage" event manually.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCALE_STORAGE_KEY) {
        setStoredLocale(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return useMemo<Direction>(() => {
    const locale = storedLocale ?? language ?? "en";
    return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
  }, [storedLocale, language]);
}
