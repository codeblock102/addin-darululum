import { useState, useCallback } from "react";

const STORAGE_KEY = "pageHelpEnabled";

export const usePageHelp = () => {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "false";
    } catch {
      return true;
    }
  });

  const toggle = useCallback((value: boolean) => {
    setEnabled(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // ignore
    }
  }, []);

  return { enabled, toggle };
};
