"use client";

import {
  DEFAULT_THEME,
  isThemeMode,
  THEME_STORAGE_KEY,
  THEME_TRANSITION_MS,
  type ThemeMode,
} from "./constants";

export function getStoredTheme(): ThemeMode {
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

/** Read the active theme from `<html data-theme>` (set by init script or applyTheme). */
export function readThemeFromDocument(): ThemeMode {
  if (typeof document === "undefined") {
    return DEFAULT_THEME;
  }
  const attr = document.documentElement.getAttribute("data-theme");
  return isThemeMode(attr) ? attr : DEFAULT_THEME;
}

function setThemeOnRoot(theme: ThemeMode): void {
  document.documentElement.setAttribute("data-theme", theme);
}

function enableTransitionFallback(): void {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  window.setTimeout(() => {
    root.classList.remove("theme-transition");
  }, THEME_TRANSITION_MS);
}

/** Apply theme with smooth crossfade / color interpolation and no layout shift. */
export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  if (root.getAttribute("data-theme") === theme) {
    return;
  }

  const update = () => setThemeOnRoot(theme);

  if (
    typeof document !== "undefined" &&
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    document.startViewTransition(update);
    return;
  }

  enableTransitionFallback();
  update();
}

export function toggleTheme(current: ThemeMode): ThemeMode {
  return current === "light" ? "dark" : "light";
}
