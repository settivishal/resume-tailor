"use client";

import { cn, button, focusRing, radius, typography } from "@/lib/ui";
import { useTheme } from "./ThemeProvider";

/** Theme switch for the app chrome task bar. */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5",
        radius.lg,
        typography.caption,
        "font-medium",
        button.secondaryOutline,
        focusRing,
      )}
    >
      <span aria-hidden className="text-sm leading-none">
        {isDark ? "☀" : "☾"}
      </span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
