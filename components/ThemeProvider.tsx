"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  applyTheme,
  readThemeFromDocument,
  setStoredTheme,
  toggleTheme,
} from "@/lib/theme/client";
import { DEFAULT_THEME, type ThemeMode } from "@/lib/theme/constants";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribeTheme(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  window.addEventListener("storage", onStoreChange);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStoreChange);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readThemeFromDocument,
    () => DEFAULT_THEME,
  );

  const setTheme = useCallback((next: ThemeMode) => {
    applyTheme(next);
    setStoredTheme(next);
  }, []);

  const toggle = useCallback(() => {
    const next = toggleTheme(theme);
    applyTheme(next);
    setStoredTheme(next);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme: toggle }),
    [theme, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
