/**
 * Theme mode system — light / dark switching infrastructure.
 *
 * CSS tokens live in `app/semantic-theme.css` and related theme files:
 *   - `:root`, `[data-theme="light"]` → light (default)
 *   - `[data-theme="dark"]`           → dark
 *
 * Runtime applies `data-theme` on `<html>` and persists choice in localStorage.
 */

export const THEME_STORAGE_KEY = "resume-tailor-theme";

export type ThemeMode = "light" | "dark";

export const DEFAULT_THEME: ThemeMode = "light";

/** Inline script run before paint to avoid theme flash. Keep in sync with helpers below. */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function setStoredTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export function toggleTheme(current: ThemeMode): ThemeMode {
  return current === "light" ? "dark" : "light";
}
