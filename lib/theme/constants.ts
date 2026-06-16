/**
 * Theme constants — safe for Server and Client Components.
 *
 * CSS tokens live in `app/semantic-theme.css` and related theme files:
 *   - `:root`, `[data-theme="light"]` → light (default)
 *   - `[data-theme="dark"]`           → dark
 */

export const THEME_STORAGE_KEY = "resume-tailor-theme";

export type ThemeMode = "light" | "dark";

export const DEFAULT_THEME: ThemeMode = "light";

/** Inline script run before paint to avoid theme flash. Keep in sync with client helpers. */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark";
}
